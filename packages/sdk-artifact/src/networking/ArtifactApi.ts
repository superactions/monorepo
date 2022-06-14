import { FormData } from 'formdata-polyfill/esm.min.js'
import { join } from 'path'
import stream from 'stream'

import { HttpClient } from './HttpClient'

/**
 * @internal class used to simplify communication with SuperActions Artifact API
 */
export class ArtifactApi {
  constructor(private readonly httpClient: HttpClient, public readonly apiRoot: string) {}

  async uploadArtifact(file: stream.Readable, size: number, key: string): Promise<void> {
    const form = new FormData()

    // we need stream size to be able to send is as formdata: https://github.com/jimmywarting/FormData/issues/138
    form.append('file', {
      [Symbol.toStringTag]: 'File',
      size: size,
      name: 'foo.txt',
      stream() {
        return file
      },
    } as any)

    await this.httpClient.post(join(this.apiRoot, 'artifact/file/', key), form)
  }

  async downloadArtifact(name: string): Promise<stream.Readable> {
    return await this.httpClient.stream(join(this.apiRoot, 'artifact/file/', name))
  }
}
