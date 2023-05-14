import type {JWKInterface} from 'arweave/node/lib/wallet'
import {checkFileExists, OutputType, getGatewayUrl, joinUrl} from './utils'
import * as core from '@actions/core'
import {archiveUrl} from './archive'
import fsPromises from 'fs/promises'
import 'cross-fetch/polyfill'

async function run(): Promise<void> {
  try {
    const gatewayUrl = getGatewayUrl()
    const jwk = core.getInput('jwk')
    const url_path = core.getInput('url_file_path')
    const output_path = core.getInput('output_file_path') || 'saved.json'
    const output: OutputType[] = []
    const urls = (await fsPromises.readFile(url_path))
      .toString()
      .trim()
      .split('\n')
    for (let url of urls) {
      url = url.trim()
      const {manifestID, title, timestamp} = await archiveUrl(
        JSON.parse(jwk) as JWKInterface,
        url
      )
      output.push({
        title,
        url,
        webpage: joinUrl(gatewayUrl, manifestID),
        screenshot: joinUrl(gatewayUrl, `${manifestID}/screenshot`),
        timestamp
      })
    }
    const outputToSave = JSON.stringify(output, null, 2)
    if (!(await checkFileExists(output_path))) {
      await fsPromises.writeFile(output_path, outputToSave)
    } else {
      const fileContent = await fsPromises.readFile(output_path)
      let savedUrls: OutputType[] = JSON.parse(fileContent.toString() || '[]')
      savedUrls = [...savedUrls, ...output]
      await fsPromises.writeFile(
        output_path,
        JSON.stringify(savedUrls, null, 2)
      )
    }

    core.info(outputToSave)
    core.setOutput('output', outputToSave)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
