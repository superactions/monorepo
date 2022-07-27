import { FormData } from 'formdata-polyfill/esm.min.js'
import * as stream from 'stream'
import urlJoin from 'url-join'

import { HttpClient } from './HttpClient'

/**
 * class used to simplify communication with SuperActions Artifact API
 */
export class ArtifactApi {
  constructor(
    private readonly httpClient: HttpClient,
    public readonly apiRoot: string,
    public readonly artifactProxyRoot: string,
    public readonly authToken: string,
    public readonly repoFullName: string,
  ) {}

  async uploadArtifact(file: stream.Readable, size: number, key: string, contentType: string): Promise<void> {
    const form = new FormData()

    // we need stream size to be able to send is as formdata: https://github.com/jimmywarting/FormData/issues/138
    form.append('file', {
      [Symbol.toStringTag]: 'File',
      size: size,
      name: 'foo.txt',
      stream() {
        return file
      },
      type: contentType,
    } as any)

    await this.httpClient.post(
      urlJoin(this.apiRoot, 'artifact/file/', escapeSpecialCharsFromPath(key)),
      form,
      this.authToken,
    )
  }

  async downloadArtifact(name: string): Promise<stream.Readable> {
    return await this.httpClient.stream(this.getArtifactUrl(name))
  }

  getArtifactUrl(name: string): string {
    return urlJoin(this.artifactProxyRoot, this.repoFullName, escapeSpecialCharsFromPath(name))
  }

  getPageUrl(dirPath: string, fileName: string = ''): string {
    const [protocol, urlWithoutProtocol] = this.artifactProxyRoot.split('://')
    const subDomainsChain = [...this.repoFullName.split('/'), ...dirPath.split('/')]
    return urlJoin(`${protocol}://${subDomainsChain.join('_')}.${urlWithoutProtocol}`, fileName)
  }
}

function escapeSpecialCharsFromPath(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/')
}
