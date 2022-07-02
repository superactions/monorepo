import { expect } from 'earljs'
import { FormData } from 'formdata-polyfill/esm.min'
import { Readable } from 'stream'

import { mock } from '../__test/mock'
import { ArtifactApi } from './ArtifactApi'
import { HttpClient } from './HttpClient'

describe('ArtifactApi', () => {
  const fileStream = Readable.from(['input string'])
  const fileLength = 100
  const apiRoot = 'https://localhost:0'
  const authToken = 'USER1_REPO1'
  const repoFullName = 'user1/repo1'

  it('uploads artifact', async () => {
    const mockHttpClient = mock<HttpClient>({
      post: async () => ({
        status: 'created',
      }),
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, authToken, repoFullName)

    await artifactApi.uploadArtifact(fileStream, fileLength, 'some-path/image.jpg', 'image/jpeg')

    expect(mockHttpClient.post).toHaveBeenCalledExactlyWith([
      ['https://localhost:0/artifact/file/some-path/image.jpg', expect.a(FormData), authToken],
    ])
  })

  it('downloads artifact', async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({
      stream: async () => fileStream,
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, authToken, repoFullName)

    const actualFileStream = await artifactApi.downloadArtifact('some-path/image.jpg')

    expect(actualFileStream).toEqual(fileStream)
    expect(mockHttpClient.stream).toHaveBeenCalledExactlyWith([
      [`https://localhost:0/artifact/file/${repoFullName}/some-path/image.jpg`],
    ])
  })

  it('returns artifact URL', async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({})
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, authToken, repoFullName)

    const actualUrl = artifactApi.getArtifactUrl('deep/path/image.jpg')

    expect(actualUrl).toEqual(`https://localhost:0/artifact/file/${repoFullName}/deep/path/image.jpg`)
  })
})
