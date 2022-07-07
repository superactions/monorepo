import { expect } from 'earljs'
import { ReadStream } from 'fs'
import { readFile, rm, writeFile } from 'fs/promises'
import { Readable } from 'stream'

import { mock } from './__test/mock'
import { ArtifactClient } from './ArtifactClient'
import { ArtifactApi } from './networking/ArtifactApi'
import { HttpClient } from './networking/HttpClient'

const p = ArtifactClient.prototype

describe(ArtifactClient.name, () => {
  const fileFath = 'file.json'
  const value = { foo: 'bar' }
  const fileContent = JSON.stringify(value)
  const key = 'artifact-key'

  it(p.uploadFile.name, async () => {
    await writeFile(fileFath, fileContent)
    const mockArtifactsApi = mock<ArtifactApi>({
      uploadArtifact: async () => undefined,
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    await artifactClient.uploadFile(key, fileFath)

    expect(mockArtifactsApi.uploadArtifact).toHaveBeenCalledExactlyWith([
      [expect.a(ReadStream), fileContent.length, key, 'application/json'],
    ])
    await rm(fileFath)
  })

  it(p.uploadValue.name, async () => {
    const mockArtifactsApi = mock<ArtifactApi>({
      uploadArtifact: async () => undefined,
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    await artifactClient.uploadValue(key, value)

    expect(mockArtifactsApi.uploadArtifact).toHaveBeenCalledExactlyWith([
      [expect.a(ReadStream), fileContent.length, key, 'application/json'],
    ])
  })

  it(p.downloadFile.name, async () => {
    const mockArtifactsApi = mock<ArtifactApi>({
      downloadArtifact: async () => Readable.from([fileContent]),
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    await artifactClient.downloadFile(key, fileFath)

    const actualFileContent = await readFile(fileFath)
    expect(actualFileContent.toString()).toEqual(fileContent)
    expect(mockArtifactsApi.downloadArtifact).toHaveBeenCalledExactlyWith([[key]])
    await rm(fileFath)
  })

  it(p.downloadValue.name, async () => {
    const mockArtifactsApi = mock<ArtifactApi>({
      downloadArtifact: async () => Readable.from([fileContent]),
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    const actualValue = await artifactClient.downloadValue(key)

    expect(actualValue).toEqual(value)
    expect(mockArtifactsApi.downloadArtifact).toHaveBeenCalledExactlyWith([[key]])
  })

  it(p.getArtifactUrl.name, async () => {
    const apiRoot = 'https://localhost:0'
    const mockHttpClient = mock<HttpClient>({})
    const repoFullName = 'user1/repo1'
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, '', repoFullName)
    const artifactClient = new ArtifactClient(artifactApi)

    const actualArtifactUrl = artifactClient.getArtifactUrl(key)

    expect(actualArtifactUrl).toEqual('https://localhost:0/artifact/file/user1/repo1/artifact-key')
  })
})
