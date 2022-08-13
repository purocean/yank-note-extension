import { registerPlugin } from '@yank-note/runtime-api'

const extensionId = __EXTENSION_ID__

const runCmds: Record<string, string | { cmd: string, args: string[] }> = {
  bat: '@chcp 65001 > nul & cmd /q /c "$tmpFile.bat"',
  sh: { cmd: 'sh', args: ['-c'] },
  shell: { cmd: 'sh', args: ['-c'] },
  bash: { cmd: 'bash', args: ['-c'] },
  php: { cmd: 'php', args: ['-r'] },
  python: { cmd: 'python', args: ['-c'] },
  py: { cmd: 'python3', args: ['-c'] },
  node: { cmd: 'node', args: ['-e'] },
}

const terminalCmds: Record<string, { start: string, exit: string }> = {
  bat: { start: 'cmd.exe', exit: 'exit' },
  shell: { start: '', exit: 'exit' },
  sh: { start: 'sh', exit: 'exit' },
  bash: { start: 'bash', exit: 'exit' },
  php: { start: 'php -a', exit: 'exit' },
  python: { start: 'python', exit: 'exit()' },
  py: { start: 'python', exit: 'exit()' },
  node: { start: 'node', exit: '.exit' },
}

registerPlugin({
  name: extensionId,
  register (ctx) {
    ctx.runner.registerRunner({
      name: 'code-runner',
      order: 127,
      match (language) {
        return !!(runCmds[language.toLowerCase()])
      },
      getTerminalCmd (language) {
        return terminalCmds[language.toLowerCase()] || null
      },
      async run (language, code) {
        const cmd = runCmds[language.toLowerCase()]
        if (!cmd) {
          return {
            type: 'plain',
            value: `Language ${language} not supported`
          }
        }

        if (language === 'bat') {
          code = code.replace(/\r?\n/g, '\r\n')
        }

        if (!ctx.env.isWindows && language === 'bat') {
          return {
            type: 'plain',
            value: `Language ${language} not supported on this platform`
          }
        }

        const reader: any = await ctx.api.runCode(cmd, code, true)
        return {
          type: 'plain',
          value: reader
        }
      },
    })
  }
})
