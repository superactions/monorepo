import { expect } from 'earljs'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'
import { dirSync, setGracefulCleanup, withFile } from 'tmp-promise'

import { mock } from './__test/mock'
import { ArtifactClient } from './ArtifactClient'
import { ArtifactApi } from './networking/ArtifactApi'
import { HttpClient } from './networking/HttpClient'

const p = ArtifactClient.prototype
setGracefulCleanup()

describe(ArtifactClient.name, () => {
  const value = { foo: 'bar' }
  const fileContent = JSON.stringify(value)
  const key = 'artifact-key'

  it(p.uploadFile.name, async () => {
    await withFile(
      async ({ fd, path }) => {
        writeFileSync(fd, fileContent)
        const mockArtifactsApi = mock<ArtifactApi>({
          uploadArtifact: async () => undefined,
        })
        const artifactClient = new ArtifactClient(mockArtifactsApi)

        await artifactClient.uploadFile(key, path)

        expect(mockArtifactsApi.uploadArtifact).toHaveBeenCalledExactlyWith([
          [expect.a(Function), fileContent.length, key, 'application/json'],
        ])
      },
      { postfix: '.json' },
    )
  })

  it(p.uploadDirectory.name, async () => {
    const { name: dir } = dirSync()
    const body = JSON.stringify({ value: 'a' })
    writeFileSync(join(dir, 'a.json'), body)
    mkdirSync(join(dir, 'nested'))
    writeFileSync(join(dir, 'nested/b.json'), body)

    const mockArtifactsApi = mock<ArtifactApi>({
      uploadArtifact: async () => undefined,
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    await artifactClient.uploadDirectory(key, dir)

    expect(mockArtifactsApi.uploadArtifact).toHaveBeenCalledExactlyWith([
      [expect.a(Function), body.length, 'artifact-key/a.json', 'application/json'],
      [expect.a(Function), body.length, 'artifact-key/nested/b.json', 'application/json'],
    ])
  })

  it(p.uploadValue.name, async () => {
    const mockArtifactsApi = mock<ArtifactApi>({
      uploadArtifact: async () => undefined,
    })
    const artifactClient = new ArtifactClient(mockArtifactsApi)

    await artifactClient.uploadValue(key, value)

    expect(mockArtifactsApi.uploadArtifact).toHaveBeenCalledExactlyWith([
      [expect.a(Function), fileContent.length, key, 'application/json'],
    ])
  })

  it(p.downloadFile.name, async () => {
    await withFile(
      async ({ path }) => {
        const mockArtifactsApi = mock<ArtifactApi>({
          downloadArtifact: async () => Readable.from([fileContent]),
        })
        const artifactClient = new ArtifactClient(mockArtifactsApi)

        await artifactClient.downloadFile(key, path)

        const actualFileContent = await readFile(path)
        expect(actualFileContent.toString()).toEqual(fileContent)
        expect(mockArtifactsApi.downloadArtifact).toHaveBeenCalledExactlyWith([[key]])
      },
      { postfix: '.json' },
    )
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
    const artifactProxyRoot = 'https://localhost:1'
    const mockHttpClient = mock<HttpClient>({})
    const repoFullName = 'user1/repo1'
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, '', repoFullName)
    const artifactClient = new ArtifactClient(artifactApi)

    const actualArtifactUrl = artifactClient.getArtifactUrl(key)

    expect(actualArtifactUrl).toEqual('https://localhost:1/user1/repo1/artifact-key')
  })

  it(p.getPageUrl.name, async () => {
    const apiRoot = 'https://localhost:0'
    const artifactProxyRoot = 'https://localhost:1'
    const mockHttpClient = mock<HttpClient>({})
    const repoFullName = 'user1/repo1'
    const artifactApi = new ArtifactApi(mockHttpClient, apiRoot, artifactProxyRoot, '', repoFullName)
    const artifactClient = new ArtifactClient(artifactApi)

    const actualArtifactUrl = artifactClient.getPageUrl(key)

    expect(actualArtifactUrl).toEqual('https://user1_repo1_artifact-key.localhost:1')
  })
})
