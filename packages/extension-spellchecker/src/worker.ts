import { JSONRPCServer, JSONRPCServerChannel, JSONRPCRequest, JSONRPCResponse } from 'jsonrpc-bridge'
import { loadModule, Hunspell } from 'hunspell-asm'

class WorkerChannel implements JSONRPCServerChannel {
  send (message: JSONRPCResponse): void {
    self.postMessage({ from: 'spell-worker', message })
  }

  setMessageHandler (callback: (msg: JSONRPCRequest) => void): void {
    self.addEventListener('message', (event) => {
      const { message, from } = event.data
      if (from === 'spell-main') {
        callback(message)
      }
    })
  }
}

let hunspell: Hunspell | null = null

const exportMain = {
  async initDictionary (affBuf: ArrayBuffer, dicBuf: ArrayBuffer, userBuf: ArrayBuffer) {
    const factory = await loadModule()
    const affPath = factory.mountBuffer(new Uint8Array(affBuf), 'main.aff')
    const dicPath = factory.mountBuffer(new Uint8Array(dicBuf), 'main.dic')
    const userPath = factory.mountBuffer(new Uint8Array(userBuf), 'user.dic')
    hunspell = factory.create(affPath, dicPath)
    hunspell.addDictionary(userPath)
  },
  check (word: string) {
    return hunspell ? hunspell.spell(word) : true
  },
  suggest (word: string) {
    return hunspell ? hunspell.suggest(word) : []
  },
  addWord (word: string) {
    hunspell?.addWord(word)
  }
}

type X = typeof exportMain

export type WorkerMainModule = { main: X }

const server = new JSONRPCServer(new WorkerChannel(), { debug: false })
server.addModule('main', exportMain)
