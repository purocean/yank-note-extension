import type { Ctx } from '@yank-note/runtime-api'
import type { GitBaselineRequest, GitBaselineResult } from './types'

export function createGitBaselineRpcCode (
  extensionId: string,
  request: GitBaselineRequest
) {
  const extensionDirectory = extensionId.replace(/\//g, '$')
  return `
    const path = require('path')
    const extensionDirectory = require('./constant').USER_EXTENSION_DIR
    const wsl = require('./wsl')
    const request = ${JSON.stringify(request)}
    if (wsl.isWsl && /^[a-zA-Z]:[\\\\/]/.test(request.absolutePath)) {
      request.absolutePath = wsl.toWslPath(request.absolutePath)
    }
    const modulePath = path.join(
      extensionDirectory,
      ${JSON.stringify(extensionDirectory)},
      'server/git-baseline.cjs'
    )
    const extensionRequire = require('module').createRequire(modulePath)
    const resolvedModulePath = extensionRequire.resolve(modulePath)
    delete extensionRequire.cache[resolvedModulePath]
    return extensionRequire(resolvedModulePath).resolveGitBaseline(request)
  `
}

export async function fetchGitBaseline (
  ctx: Ctx,
  request: GitBaselineRequest
): Promise<GitBaselineResult> {
  return ctx.api.rpc(createGitBaselineRpcCode(__EXTENSION_ID__, request))
}
