import { ArtifactClient } from './ArtifactClient'
import { ArtifactApi } from './networking/ArtifactApi'
import { HttpClient } from './networking/HttpClient'

const DEFAULT_API_ROOT = 'https://api.superactions.io/v1/health'

export function create(overrideApiRoot?: string): ArtifactClient {
  const httpClient = new HttpClient()
  const api = new ArtifactApi(httpClient, overrideApiRoot ?? DEFAULT_API_ROOT)
  const client = new ArtifactClient(api)

  return client
}
