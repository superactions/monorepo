import { createReadStream, createWriteStream, statSync } from 'fs'
import { pipeline } from 'stream'
import { promisify } from 'util'

import { ArtifactApi } from './networking/ArtifactApi'
const streamPipeline = promisify(pipeline)

/**
 * User facing class used for communication with SuperActions Artifact API.
 * Contains many convenience methods.
 */
export class ArtifactClient {
  constructor(private readonly artifactsApi: ArtifactApi) {}

  async uploadFile(key: string, file: string): Promise<void> {
    // @todo: ensure that filepath is absolute
    // @todo: support passing file as stream or buffer
    const { size } = statSync(file)
    const fileStream = createReadStream(file)

    return await this.artifactsApi.uploadArtifact(fileStream, size, key)
  }

  async downloadFile(key: string, destinationPath: string): Promise<void> {
    // @todo: ensure that filepath is absolute
    // @todo: support passing file as stream or buffer
    const fileStream = await this.artifactsApi.downloadArtifact(key)
    await streamPipeline(fileStream, createWriteStream(destinationPath))
  }
}
