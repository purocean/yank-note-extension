import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { createGitBaselineRpcCode } from '../src/git-rpc'

const { resolveGitBaseline } = require('../server/git-baseline.cjs') as {
  resolveGitBaseline: (
    request: { absolutePath: string, knownRevision?: string },
    dependencies: { path: typeof path, execFile: Function }
  ) => Promise<any>
}

interface CommandResult {
  ok: boolean
  code?: number | string
  stdout?: string
}

function createGitDependencies (resolveCommand: (args: string[]) => CommandResult) {
  const calls: string[][] = []
  const execFile = (_command: string, args: string[], _options: unknown, callback: Function) => {
    calls.push(args)
    const result = resolveCommand(args)
    const error = result.ok ? null : Object.assign(new Error('git failed'), { code: result.code ?? 128 })
    queueMicrotask(() => callback(error, result.stdout || '', ''))
  }
  return { dependencies: { path, execFile }, calls }
}

function successfulRepository (overrides: (args: string[]) => CommandResult = () => ({ ok: true })) {
  return createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/repo\n' }
    if (args.includes('--verify')) return { ok: true, stdout: 'revision-1\n' }
    if (args.includes('cat-file')) return { ok: true }
    if (args.includes('show')) return { ok: true, stdout: 'from head\n' }
    return overrides(args)
  })
}

test('returns none outside a Git repository or for ignored files', async () => {
  const noRepository = createGitDependencies(() => ({ ok: false, code: 128 }))
  assert.deepEqual(
    await resolveGitBaseline({ absolutePath: '/notes/a.md' }, noRepository.dependencies),
    { source: 'none' }
  )

  const ignored = createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/repo\n' }
    if (args.includes('--verify')) return { ok: true, stdout: 'revision-1\n' }
    if (args.includes('cat-file')) return { ok: false }
    if (args.includes('check-ignore')) return { ok: true }
    return { ok: false }
  })
  assert.deepEqual(
    await resolveGitBaseline({ absolutePath: '/repo/a.md' }, ignored.dependencies),
    { source: 'none' }
  )

  const invalidRoot = createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/another-repo\n' }
    return { ok: false }
  })
  assert.deepEqual(
    await resolveGitBaseline({ absolutePath: '/repo/a.md' }, invalidRoot.dependencies),
    { source: 'none' }
  )
})

test('returns empty Git baselines for unborn repositories and new files', async () => {
  const unborn = createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/repo\n' }
    if (args.includes('check-ignore')) return { ok: false, code: 1 }
    return { ok: false, code: 128 }
  })
  assert.deepEqual(
    await resolveGitBaseline({ absolutePath: '/repo/a.md' }, unborn.dependencies),
    { source: 'git', content: '', revision: null, fileState: 'new' }
  )

  const withNewFile = createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/repo\n' }
    if (args.includes('check-ignore')) return { ok: false, code: 1 }
    if (args.includes('--verify')) return { ok: true, stdout: 'revision-1\n' }
    if (args.includes('cat-file')) return { ok: false, code: 128 }
    return { ok: true }
  })
  assert.deepEqual(
    await resolveGitBaseline({ absolutePath: '/repo/a.md' }, withNewFile.dependencies),
    { source: 'git', content: '', revision: 'revision-1', fileState: 'new' }
  )
})

test('reads tracked HEAD content and skips it when revision is unchanged', async () => {
  const tracked = successfulRepository()
  assert.deepEqual(await resolveGitBaseline({
    absolutePath: '/repo/docs/a.md',
  }, tracked.dependencies), {
    source: 'git',
    content: 'from head\n',
    revision: 'revision-1',
    fileState: 'tracked',
  })
  assert.ok(tracked.calls.some(args => args.includes('HEAD:docs/a.md')))

  const unchanged = successfulRepository()
  assert.deepEqual(await resolveGitBaseline({
    absolutePath: '/repo/docs/a.md',
    knownRevision: 'revision-1',
  }, unchanged.dependencies), {
    source: 'git',
    content: null,
    revision: 'revision-1',
    fileState: 'tracked',
    unchanged: true,
  })
  assert.equal(unchanged.calls.some(args => args.includes('cat-file') || args.includes('show')), false)
})

test('rejects transient Git execution failures instead of changing baseline semantics', async () => {
  const unavailable = createGitDependencies(() => ({ ok: false, code: 'ENOENT' }))
  await assert.rejects(
    resolveGitBaseline({ absolutePath: '/repo/a.md' }, unavailable.dependencies),
    /Git executable is unavailable/
  )

  const unreadable = createGitDependencies(args => {
    if (args.includes('--show-toplevel')) return { ok: true, stdout: '/repo\n' }
    if (args.includes('--verify')) return { ok: true, stdout: 'revision-1\n' }
    if (args.includes('cat-file')) return { ok: true }
    if (args.includes('show')) return { ok: false, code: 1 }
    return { ok: false, code: 1 }
  })
  await assert.rejects(
    resolveGitBaseline({ absolutePath: '/repo/a.md' }, unreadable.dependencies),
    /Unable to read the Git HEAD file/
  )
})

test('RPC bridge locates the extension helper and safely carries paths', async () => {
  const request = { absolutePath: '/repo/a "quoted".md' }
  const code = createGitBaselineRpcCode('@yank-note/extension-change-gutter', request)
  const AsyncFunction = Object.getPrototypeOf(async () => 0).constructor
  let loadedModule = ''
  const nodeRequire = (id: string) => {
    if (id === 'path') return path
    if (id === './constant') return { USER_EXTENSION_DIR: '/extensions' }
    if (id === './wsl') return { isWsl: false }
    if (id === 'module') {
      return {
        createRequire: () => Object.assign((modulePath: string) => {
          loadedModule = modulePath
          return { resolveGitBaseline: (value: unknown) => value }
        }, { cache: {}, resolve: (modulePath: string) => modulePath })
      }
    }
    throw new Error(`Unexpected require: ${id}`)
  }
  const result = await new AsyncFunction('require', code)(nodeRequire)

  assert.deepEqual(result, request)
  assert.equal(loadedModule, '/extensions/@yank-note$extension-change-gutter/server/git-baseline.cjs')
})

test('RPC bridge converts Windows paths when the server runs in WSL', async () => {
  const code = createGitBaselineRpcCode('@yank-note/extension-change-gutter', {
    absolutePath: 'C:\\notes\\a.md',
  })
  const AsyncFunction = Object.getPrototypeOf(async () => 0).constructor
  const nodeRequire = (id: string) => {
    if (id === 'path') return path
    if (id === './constant') return { USER_EXTENSION_DIR: '/extensions' }
    if (id === './wsl') {
      return {
        isWsl: true,
        toWslPath: () => '/mnt/c/notes/a.md',
      }
    }
    if (id === 'module') {
      return {
        createRequire: () => Object.assign(() => ({
          resolveGitBaseline: (value: unknown) => value,
        }), { cache: {}, resolve: (modulePath: string) => modulePath })
      }
    }
    throw new Error(`Unexpected require: ${id}`)
  }

  const result = await new AsyncFunction('require', code)(nodeRequire)
  assert.deepEqual(result, { absolutePath: '/mnt/c/notes/a.md' })
})
