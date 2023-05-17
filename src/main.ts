import * as core from '@actions/core'
import {Archive} from 'arweave-archive'
import 'cross-fetch/polyfill'

import fsPromises from 'node:fs/promises'
import fs from 'fs'

export type OutputType = {
  title: string
  webpage: string
  screenshot: string
  url: string
  timestamp: number
}

async function run(): Promise<void> {
  try {
    const gatewayUrl = getGatewayUrl()
    const bundlerUrl = getBundlerUrl()
    const jwk = core.getInput('jwk')
    const url_path = core.getInput('url_file_path')
    const output_path = core.getInput('output_file_path') || 'saved.json'
    const output: OutputType[] = []
    const urls = (await fsPromises.readFile(url_path))
      .toString()
      .trim()
      .split('\n')
    const archive = new Archive(JSON.parse(jwk), gatewayUrl, bundlerUrl)
    for (let url of urls) {
      url = url.trim()
      const {txID, title, timestamp} = await archive.archiveUrl(url)
      output.push({
        title,
        url,
        webpage: joinUrl(gatewayUrl, txID),
        screenshot: joinUrl(gatewayUrl, `${txID}/screenshot`),
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

async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fsPromises.access(file, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

function getGatewayUrl(): string {
  return core.getInput('gateway_url') || 'https://arweave.net'
}

function getBundlerUrl(): string {
  return core.getInput('bundler_url') || 'https://node2.bundlr.network'
}

function joinUrl(baseUrl: string, pathUrl: string): string {
  return new URL(pathUrl, baseUrl).toString()
}

run()
