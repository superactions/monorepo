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
  const artifactProxyRoot = 'https://localhost:1'
  const authToken = 'USER1_REPO1'
  const repoFullName = 'user1/repo1'

  it('uploads artifact', async () => {
    const mockHttpClient = mock<HttpClient>({
      post: async () => ({
        status: 'created',
      }),
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    await artifactApi.uploadArtifact(fileStream, fileLength, 'some-path/image.jpg', 'image/jpeg')

    expect(mockHttpClient.post).toHaveBeenCalledExactlyWith([
      ['https://localhost:0/artifact/file/some-path/image.jpg', expect.a(FormData), authToken],
    ])
  })

  it('uploads artifact with a name with special characters', async () => {
    const mockHttpClient = mock<HttpClient>({
      post: async () => ({
        status: 'created',
      }),
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    await artifactApi.uploadArtifact(fileStream, fileLength, 'some-path/image%1 .jpg', 'image/jpeg')

    expect(mockHttpClient.post).toHaveBeenCalledExactlyWith([
      ['https://localhost:0/artifact/file/some-path/image%251%20.jpg', expect.a(FormData), authToken],
    ])
  })

  it('downloads artifact', async () => {
    const mockHttpClient = mock<HttpClient>({
      stream: async () => fileStream,
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    const actualFileStream = await artifactApi.downloadArtifact('some-path/image.jpg')

    expect(actualFileStream).toEqual(fileStream)
    expect(mockHttpClient.stream).toHaveBeenCalledExactlyWith([
      [`https://localhost:1/${repoFullName}/some-path/image.jpg`],
    ])
  })

  it('downloads artifact with special characters', async () => {
    const mockHttpClient = mock<HttpClient>({
      stream: async () => fileStream,
    })
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    const actualFileStream = await artifactApi.downloadArtifact('some-path/image%1 .jpg')

    expect(actualFileStream).toEqual(fileStream)
    expect(mockHttpClient.stream).toHaveBeenCalledExactlyWith([
      [`https://localhost:1/${repoFullName}/some-path/image%251%20.jpg`],
    ])
  })

  it('returns artifact URL', async () => {
    const mockHttpClient = mock<HttpClient>({})
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    const actualUrl = artifactApi.getArtifactUrl('deep/path/image.jpg')

    expect(actualUrl).toEqual(`https://localhost:1/${repoFullName}/deep/path/image.jpg`)
  })

  it('returns page URL', async () => {
    const mockHttpClient = mock<HttpClient>({})
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    const actualUrl = artifactApi.getPageUrl('deep/path')

    expect(actualUrl).toEqual(`https://user1_repo1_deep_path.localhost:1`)
  })

  it('returns page URL with custom fileName', async () => {
    const mockHttpClient = mock<HttpClient>({})
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, authToken, repoFullName)

    const actualUrl = artifactApi.getPageUrl('deep/path', 'alternative-index.html')

    expect(actualUrl).toEqual(`https://user1_repo1_deep_path.localhost:1/alternative-index.html`)
  })
})
