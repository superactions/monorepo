import * as github from '@actions/github'

import { ArtifactClient } from './ArtifactClient'
import { extractCommitContext } from './github/extractCommitContext'
import { ArtifactApi } from './networking/ArtifactApi'
import { HttpClient } from './networking/HttpClient'
import { PrArtifactClient } from './PrArtifactClient'

const DEFAULT_API_ROOT = 'https://api.superactions.io/v1'

export function create(overrideApiRoot?: string): ArtifactClient {
  const httpClient = new HttpClient()
  const api = new ArtifactApi(httpClient, overrideApiRoot ?? DEFAULT_API_ROOT)

  const commitCtx = extractCommitContext(github.context)
  const prClient = new PrArtifactClient(api, commitCtx)

  return prClient
}
