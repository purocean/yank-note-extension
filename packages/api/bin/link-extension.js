#!/usr/bin/env node

// @ts-check

/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const cwd = process.cwd()
const packageJson = require(path.join(cwd, '/package.json'))

const isUnlink = process.argv[2] === '--unlink'
const id = packageJson.name
const extensionDir = path.join(os.homedir(), 'yank-note', 'extensions')
const extensionPath = path.join(extensionDir, id)
const extensionBakPath = path.join(extensionDir, id + '.bak')

if (isUnlink) {
  if (fs.existsSync(extensionPath) && fs.lstatSync(extensionPath).isSymbolicLink()) {
    fs.unlinkSync(extensionPath)
    console.log(`Unlinked ${extensionPath}`)

    if (fs.existsSync(extensionBakPath) && fs.lstatSync(extensionBakPath).isDirectory()) {
      fs.moveSync(extensionBakPath, extensionPath)
      console.log(`Restored ${extensionPath}`)
    }
  } else {
    throw new Error(`${extensionPath} is not a symlink`)
  }
} else {
  if (fs.existsSync(extensionPath) && fs.lstatSync(extensionPath).isDirectory()) {
    fs.moveSync(extensionPath, extensionBakPath)
    console.log(`Moved ${extensionPath} to ${extensionBakPath}`)
  }

  fs.symlinkSync(cwd, extensionPath, 'junction')
  console.log(`Linked ${extensionPath}`)
}
