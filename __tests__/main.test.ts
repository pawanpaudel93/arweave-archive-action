import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {test} from '@jest/globals'
import fs from 'fs'

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env.LOCALHOST = 'true'
  process.env.INPUT_JWK = fs
    .readFileSync(path.join(__dirname, '..', 'jwk.json'))
    .toString()

  process.env.INPUT_URL_FILE_PATH = path
    .join(__dirname, '..', 'urls.txt')
    .toString()

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  const output = cp.execFileSync(np, [ip], options).toString()
  console.log(output)
})
