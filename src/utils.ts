import {SignatureOptions} from 'arweave/node/lib/crypto/crypto-interface'
import {createData, ArweaveSigner, DataItem} from 'arbundles'
import type {JWKInterface} from 'arweave/node/lib/wallet'
import Transaction from 'arweave/node/lib/transaction'
import {createHash, randomBytes} from 'crypto'
import {findChrome} from 'find-chrome-bin'
import fsPromises from 'node:fs/promises'
import * as core from '@actions/core'
import Arweave from 'arweave'
import axios from 'axios'
import fs from 'fs'

let arweave: Arweave

export type ReturnType = {
  status: string
  message: string
  manifestID: string
  title: string
  timestamp: number
}

export type OutputType = {
  title: string
  webpage: string
  screenshot: string
  url: string
  timestamp: number
}

type Tag = {name: string; value: string; key?: string}

type ArDataItemParams = {
  data: Uint8Array | string
  tags?: Tag[]
  target?: string
  path?: string
  key?: string
}

type ManifestPath = {
  id: string
}

export type ManifestFile = {
  manifest: string
  version: string
  index: {
    path: string
  }
  paths: Record<string, ManifestPath>
}

export async function checkFileExists(file: string): Promise<boolean> {
  try {
    await fsPromises.access(file, fs.constants.F_OK)
    return true
  } catch (error) {
    return false
  }
}

export async function getBin(): Promise<string> {
  const chromeInfo = await findChrome({})
  return chromeInfo.executablePath
}

export function initArweave(): Arweave {
  if (arweave) return arweave
  const host = new URL(getGatewayUrl()).host
  arweave = Arweave.init({
    host,
    port: 443,
    protocol: 'https'
  })
  return arweave
}

async function signTransaction(
  tx: Transaction,
  jwk: JWKInterface,
  options?: SignatureOptions
): Promise<Transaction> {
  // todo test balance
  const verifyTarget = tx.quantity && +tx.quantity > 0 && tx.target
  const targetVerificationFailure = verifyTarget
  const owner = jwk.n
  if (owner && tx.owner && tx.owner !== owner) {
    throw Error('Wrong owner')
  }
  if (!tx.owner && owner) {
    tx.setOwner(owner)
  }
  await arweave.transactions.sign(tx, jwk, options)
  if (targetVerificationFailure) {
    throw Error('The target is a transaction hash, not an account')
  }
  return tx
}

async function createDataItem(
  item: ArDataItemParams,
  signer: ArweaveSigner
): Promise<DataItem> {
  const {data, tags, target} = item
  const anchor = randomBytes(32).toString('base64').slice(0, 32)
  const dataItem = createData(data, signer, {tags, target, anchor})
  await dataItem.sign(signer)
  return dataItem
}

async function manageUpload(tx: Transaction): Promise<number | undefined> {
  if (!tx.chunks?.chunks?.length) {
    await arweave.transactions.post(tx)
    return
  }
  const uploader = await arweave.transactions.getUploader(tx)

  while (!uploader.isComplete) {
    await uploader.uploadChunk()
  }

  return uploader.lastResponseStatus
}

export async function dispatch(
  tx: Transaction,
  jwk: JWKInterface
): Promise<{id: string; type: string}> {
  const txObject = new Transaction(tx)
  if (!txObject.quantity || txObject.quantity === '0') {
    try {
      const data = txObject.get('data', {decode: true, string: false})
      const tags = txObject.tags.map(tag => ({
        name: tag.get('name', {decode: true, string: true}),
        value: tag.get('value', {decode: true, string: true})
      }))
      const target = txObject.target
      const signer = new ArweaveSigner(jwk)
      const bundleTx = await createDataItem({data, tags, target}, signer)
      const bundlerUrl = getBundlerUrl()
      const txUrl = joinUrl(bundlerUrl, 'tx')
      const res = await axios.post(txUrl, bundleTx.getRaw(), {
        headers: {'Content-Type': 'application/octet-stream'},
        maxBodyLength: Infinity
      })
      if (res.status >= 200 && res.status < 300) {
        const dispatchResult = {id: bundleTx.id, type: 'BUNDLED'}
        return dispatchResult
      }
    } catch (e) {
      //
    }
  }
  try {
    await signTransaction(txObject, jwk)
    await manageUpload(txObject)
    const dispatchResult = {id: txObject.id, type: 'BASE'}
    return dispatchResult
  } catch (e) {
    //
  }
  throw Error('error')
}

export async function readFileAsBuffer(filePath: string): Promise<Buffer> {
  return await fsPromises.readFile(filePath)
}

export async function toHash(data: Buffer): Promise<string> {
  // Calculate the SHA-256 hash of the data using the crypto module
  const hashBuffer = createHash('sha256').update(data).digest()

  // Convert the hash buffer to a hex string
  const hashHex = hashBuffer.toString('hex')

  return hashHex
}

export function getGatewayUrl(): string {
  return core.getInput('gateway_url') || 'https://arweave.net'
}

export function getBundlerUrl(): string {
  return core.getInput('bundler_url') || 'https://node2.bundlr.network'
}

export function joinUrl(baseUrl: string, pathUrl: string): string {
  return new URL(pathUrl, baseUrl).toString()
}
