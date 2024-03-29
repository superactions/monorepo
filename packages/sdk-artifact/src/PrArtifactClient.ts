import { join } from 'path'

import { ArtifactClient } from './ArtifactClient'
import { CommitContext } from './github/extractCommitContext'
import { ArtifactApi } from './networking/ArtifactApi'

/**
 * Like ArtifactClient but automatically prefixes artifacts with commit SHAs.
 */
export class PrArtifactClient extends ArtifactClient {
  constructor(artifactsApi: ArtifactApi, public readonly commitContext: CommitContext) {
    super(artifactsApi)
  }

  async uploadFile(key: string, filePath: string): Promise<void> {
    return super.uploadFile(join(this.commitContext.headSha, key), filePath)
  }

  async uploadValue(key: string, value: object): Promise<void> {
    return super.uploadValue(join(this.commitContext.headSha, key), value)
  }

  // no need to override uploadDirectory

  async downloadFile(key: string, destinationPath: string): Promise<void> {
    if (this.commitContext.event !== 'pull-request') {
      throw new Error("Can't find base branch!")
    }
    return super.downloadFile(join(this.commitContext.baseSha, key), destinationPath)
  }

  async downloadValue<T>(key: string): Promise<T | undefined> {
    if (this.commitContext.event !== 'pull-request') {
      throw new Error("Can't find base branch!")
    }
    return super.downloadValue(join(this.commitContext.baseSha, key))
  }

  // @todo: this works only for uploaded artifacts
  getArtifactUrl(key: string): string {
    return super.getArtifactUrl(join(this.commitContext.headSha, key))
  }

  // @todo: this works only for uploaded artifacts
  getPageUrl(dirPath: string, fileName?: string): string {
    return super.getPageUrl(join(this.commitContext.headSha, dirPath), fileName)
  }
}
