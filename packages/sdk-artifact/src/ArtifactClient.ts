import { createReadStream, createWriteStream, readFileSync, statSync, writeFileSync } from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'

import { ArtifactApi } from './networking/ArtifactApi'
const streamPipeline = promisify(pipeline)
import * as glob from 'glob'
import { lookup } from 'mime-types'
import { join, relative } from 'path'

/**
 * User facing class used for communication with SuperActions Artifact API.
 * Contains many convenience methods.
 */
export class ArtifactClient {
  constructor(protected readonly artifactsApi: ArtifactApi) {}

  async uploadFile(key: string, filePath: string): Promise<void> {
    // @todo: ensure that filepath is absolute
    // @todo: support passing file as stream or buffer
    const { size } = statSync(filePath)
    const fileStream = createReadStream(filePath)
    // @todo assert that contentType exists
    const contentType = lookup(filePath) as any

    return await this.artifactsApi.uploadArtifact(fileStream, size, key, contentType)
  }

  async uploadDirectory(key: string, directoryPath: string): Promise<void> {
    const allFiles = glob.sync(`${directoryPath}/**/*`, {
      absolute: true,
      follow: false,
      nodir: true,
    })

    // @todo this could be executed in parallel
    for (const absFilePath of allFiles) {
      const relPath = relative(directoryPath, absFilePath)

      await this.uploadFile(join(key, relPath), absFilePath)
    }
  }

  async uploadValue(key: string, value: object): Promise<void> {
    // @todo this begs for better implementation but creating Readable stream from string didn't work for some weird reason...
    const tmpFile = '/tmp/json.json'
    const valueAsJson = JSON.stringify(value)
    writeFileSync(tmpFile, valueAsJson)
    return this.uploadFile(key, tmpFile)
  }

  async downloadFile(key: string, destinationPath: string): Promise<void> {
    // @todo: ensure that filepath is absolute
    // @todo: support passing file as stream or buffer
    const fileStream = await this.artifactsApi.downloadArtifact(key)
    await streamPipeline(fileStream, createWriteStream(destinationPath))
  }

  async downloadValue<T>(key: string): Promise<T | undefined> {
    const tmpFile = '/tmp/json.json'
    try {
      await this.downloadFile(key, tmpFile)
      return JSON.parse(readFileSync(tmpFile, 'utf-8'))
    } catch (e: any) {
      // @todo cleaner error handling
      if (e.message.includes(404)) {
        return undefined
      }
      throw e
    }
  }

  /**
   * Returns ready to browse URL to an artifact
   * @param key - Artifact name
   * @returns Artifact URL
   */
  getArtifactUrl(key: string): string {
    return this.artifactsApi.getArtifactUrl(key)
  }

  /**
   * Returns ready to browse URL to a page ie. artifact that is supposed to be hosted from absolute path
   * @param dirPath - Path to a directory containing artifact
   * @param fileName - Artifact name, leave empty if you expect index.html
   * @returns Page URL
   */
  getPageUrl(dirPath: string, fileName: string = ''): string {
    return this.artifactsApi.getPageUrl(dirPath, fileName)
  }
}
