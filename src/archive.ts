import {APP_NAME, APP_VERSION, MANIFEST_CONTENT_TYPE} from './constants'
import type {JWKInterface} from 'arweave/node/lib/wallet'
import {execFile} from 'promisify-child-process'
import fsPromises from 'node:fs/promises'
import {directory} from 'tempy'
import mime from 'mime-types'
import path from 'path'
import fs from 'fs'
import {
  ManifestFile,
  ReturnType,
  dispatch,
  getBin,
  initArweave,
  readFileAsBuffer,
  toHash
} from './utils'

const SINGLEFILE_EXECUTABLE = './node_modules/single-file-cli/single-file'
const BROWSER_ARGS =
  '["--no-sandbox", "--window-size=1920,1080", "--start-maximized"]'

export const archiveUrl = async (
  jwk: JWKInterface,
  url: string
): Promise<ReturnType> => {
  const manifestFile: ManifestFile = {
    manifest: 'arweave/paths',
    version: '0.1.0',
    index: {
      path: 'index.html'
    },
    paths: {}
  }
  const tempDirectory = directory()
  const arweave = initArweave()
  const command = [
    `--browser-executable-path=${await getBin()}`,
    `--browser-args='${BROWSER_ARGS}'`,
    url,
    `--output=${path.resolve(tempDirectory, 'index.html')}`,
    `--base-path=${tempDirectory}`
  ]
  const {stderr} = await execFile(SINGLEFILE_EXECUTABLE, command)
  if (stderr) {
    return {
      status: 'error',
      message: stderr.toString(),
      manifestID: '',
      title: '',
      timestamp: 0
    }
  }

  // Get a list of all files in the directory
  const files = fs.readdirSync(tempDirectory)

  const metadata: {
    title: string
    url: string
  } = JSON.parse(
    (
      await readFileAsBuffer(path.join(tempDirectory, 'metadata.json'))
    ).toString()
  )
  const timestamp = Math.floor(Date.now() / 1000)

  // Loop through all files and read them as Uint8Array
  await Promise.all(
    files
      .filter(file => !file.includes('metadata.json'))
      .map(async file => {
        const filePath = path.join(tempDirectory, file)
        const isIndexFile = filePath.includes('index.html')
        const data = await readFileAsBuffer(filePath)
        const transaction = await arweave.createTransaction({
          data: new Uint8Array(data)
        })
        const mimeType = mime.lookup(filePath) || 'application/octet-stream'
        const hash = await toHash(data)
        transaction.addTag('App-Name', APP_NAME)
        transaction.addTag('App-Version', APP_VERSION)
        transaction.addTag('Content-Type', mimeType)
        transaction.addTag(
          isIndexFile ? 'page:title' : 'screenshot:title',
          metadata.title
        )
        transaction.addTag(
          isIndexFile ? 'page:url' : 'screenshot:url',
          metadata.url
        )
        transaction.addTag(
          isIndexFile ? 'page:timestamp' : 'screenshot:timestamp',
          String(timestamp)
        )
        transaction.addTag('File-Hash', hash)
        const response = await dispatch(transaction, jwk)
        manifestFile.paths[isIndexFile ? 'index.html' : 'screenshot'] = {
          id: response.id
        }
      })
  )

  const manifestTransaction = await arweave.createTransaction({
    data: JSON.stringify(manifestFile)
  })
  manifestTransaction.addTag('App-Name', APP_NAME)
  manifestTransaction.addTag('App-Version', APP_VERSION)
  manifestTransaction.addTag('Content-Type', MANIFEST_CONTENT_TYPE)
  manifestTransaction.addTag('Title', metadata.title)
  manifestTransaction.addTag('Type', 'archive')
  manifestTransaction.addTag('Url', metadata.url)
  manifestTransaction.addTag('Timestamp', String(timestamp))
  const response = await dispatch(manifestTransaction, jwk)

  await fsPromises.rm(tempDirectory, {recursive: true, force: true})
  return {
    status: 'success',
    message: `Uploaded to Arweave!`,
    manifestID: response.id,
    title: metadata.title,
    timestamp
  }
}
