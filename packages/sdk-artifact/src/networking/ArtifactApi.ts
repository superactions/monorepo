import { FormData } from 'formdata-polyfill/esm.min.js'
import stream from 'stream'
import urlJoin from 'url-join'

import { HttpClient } from './HttpClient'

/**
 * @internal class used to simplify communication with SuperActions Artifact API
 */
export class ArtifactApi {
  constructor(
    private readonly httpClient: HttpClient,
    public readonly apiRoot: string,
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

    await this.httpClient.post(urlJoin(this.apiRoot, 'artifact/file/', key), form, this.authToken)
  }

  async downloadArtifact(name: string): Promise<stream.Readable> {
    return await this.httpClient.stream(this.getArtifactUrl(name))
  }

  getArtifactUrl(name: string): string {
    return urlJoin(this.apiRoot, 'artifact/file/', this.repoFullName, name)
  }
}
