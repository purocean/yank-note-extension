'use strict'

const childProcess = require('child_process')
const nodePath = require('path')

const commandOptions = {
  encoding: 'utf8',
  maxBuffer: 8 * 1024 * 1024,
  timeout: 3000,
  windowsHide: true,
}

function runGit (args, execFile = childProcess.execFile) {
  return new Promise(resolve => {
    execFile('git', args, commandOptions, (error, stdout) => {
      resolve({
        ok: !error,
        code: error && error.code,
        stdout: typeof stdout === 'string' ? stdout : (stdout || '').toString('utf8'),
      })
    })
  })
}

/**
 * Resolve the Git HEAD baseline for one absolute file path.
 * Dependencies are injectable so this Node-side module can be unit tested
 * without Git or a repository on the host machine.
 */
async function resolveGitBaseline (request, dependencies = {}) {
  const path = dependencies.path || nodePath
  const run = args => runGit(args, dependencies.execFile)
  const absolutePath = path.resolve(request.absolutePath)
  const directory = path.dirname(absolutePath)
  const rootResult = await run(['-C', directory, 'rev-parse', '--show-toplevel'])
  if (!rootResult.ok) {
    if (rootResult.code === 128) {
      return { source: 'none' }
    }
    throw new Error('Git executable is unavailable')
  }

  const rootOutput = rootResult.stdout.trim()
  if (!rootOutput) {
    return { source: 'none' }
  }

  const root = path.resolve(rootOutput)
  const relativePath = path.relative(root, absolutePath)
  if (!relativePath || relativePath === '..' || relativePath.startsWith('..' + path.sep) || path.isAbsolute(relativePath)) {
    return { source: 'none' }
  }

  const gitPath = relativePath.split(path.sep).join('/')
  const headResult = await run(['-C', root, 'rev-parse', '--verify', 'HEAD'])
  if (!headResult.ok) {
    if (headResult.code !== 128) {
      throw new Error('Unable to read Git HEAD')
    }
    const ignored = await run(['-C', root, 'check-ignore', '-q', '--', gitPath])
    if (ignored.ok) {
      return { source: 'none' }
    }
    if (ignored.code !== 1) {
      throw new Error('Unable to inspect Git ignore rules')
    }
    return { source: 'git', content: '', revision: null, fileState: 'new' }
  }

  const revision = headResult.stdout.trim()
  if (request.knownRevision && request.knownRevision === revision) {
    return { source: 'git', content: null, revision, fileState: 'tracked', unchanged: true }
  }

  const objectName = `HEAD:${gitPath}`
  const exists = await run(['-C', root, 'cat-file', '-e', objectName])
  if (!exists.ok) {
    if (exists.code !== 128) {
      throw new Error('Unable to inspect the Git HEAD file')
    }
    const ignored = await run(['-C', root, 'check-ignore', '-q', '--', gitPath])
    if (ignored.ok) {
      return { source: 'none' }
    }
    if (ignored.code !== 1) {
      throw new Error('Unable to inspect Git ignore rules')
    }
    return { source: 'git', content: '', revision, fileState: 'new' }
  }

  const contentResult = await run(['-C', root, '--no-pager', 'show', objectName])
  if (!contentResult.ok) {
    throw new Error('Unable to read the Git HEAD file')
  }

  return {
    source: 'git',
    content: contentResult.stdout,
    revision,
    fileState: 'tracked',
  }
}

module.exports = { resolveGitBaseline }
