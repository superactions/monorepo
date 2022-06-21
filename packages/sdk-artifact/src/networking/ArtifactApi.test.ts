import { expect } from 'earljs'
import { FormData } from 'formdata-polyfill/esm.min'
import { Readable } from 'stream'

import { mock } from '../__test/mock'
import { ArtifactApi } from './ArtifactApi'
import { HttpClient } from './HttpClient'

describe('ArtifactApi', () => {
  const fileStream = Readable.from(['input string'])
  const fileLength = 100

  it('uploads artifact', async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({
      post: async () => ({
        status: 'created',
      }),
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot)

    await artifactApi.uploadArtifact(fileStream, fileLength, 'some-path/image.jpg', 'image/jpeg')

    expect(mockHttpClient.post).toHaveBeenCalledExactlyWith([
      ['https://localhost:0/artifact/file/some-path/image.jpg', expect.a(FormData)],
    ])
  })

  it('downloads artifact', async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({
      stream: async () => fileStream,
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot)

    const actualFileStream = await artifactApi.downloadArtifact('some-path/image.jpg')

    expect(actualFileStream).toEqual(fileStream)
    expect(mockHttpClient.stream).toHaveBeenCalledExactlyWith([
      ['https://localhost:0/artifact/file/some-path/image.jpg'],
    ])
  })

  it('return artifact URL', async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({})
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot)

    const actualUrl = artifactApi.getArtifactUrl('deep/path/image.jpg')

    expect(actualUrl).toEqual('https://localhost:0/artifact/file/deep/path/image.jpg')
  })
})
