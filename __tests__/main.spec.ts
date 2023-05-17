/* eslint-disable no-console */
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect} from '@jest/globals'
import Arweave from 'arweave'

let arweave: Arweave

// shows how the runner will run a JavaScript action with env / stdout protocol
describe('Testing arweave-archive-action', () => {
  beforeAll(async () => {
    arweave = Arweave.init({
      host: 'localhost',
      port: 1984,
      protocol: 'http'
    })
  }, 10000)

  it('archives urls webpages', async () => {
    process.env.INPUT_JWK = JSON.stringify(await arweave.wallets.generate())

    process.env.INPUT_URL_FILE_PATH = path
      .join(__dirname, '..', 'urls.txt')
      .toString()

    process.env.INPUT_GATEWAY_URL = 'http://localhost:1984'

    const np = process.execPath
    const ip = path.join(__dirname, '..', 'lib', 'main.js')
    const options: cp.ExecFileSyncOptions = {
      env: process.env
    }

    try {
      const output = cp.execFileSync(np, [ip], options).toString()
      console.log(output)
    } catch (error) {
      console.error(error)
      expect(error).toBeNull() // fail the test if there's an error
    }
  }, 60000)
})
