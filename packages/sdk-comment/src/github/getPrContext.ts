import { Context } from '@actions/github/lib/context'

export type PrContext = {
  owner: string
  repo: string
  pullRequestNumber: number
}

export function getPrContextFromGithubContext(context: Context): PrContext | undefined {
  const {
    payload: { pull_request: pullRequest, repository },
  } = context

  if (!repository || !pullRequest) {
    return
  }

  const { full_name: repoFullName } = repository
  const [owner, repo] = repoFullName!.split('/')

  return {
    owner,
    repo,
    pullRequestNumber: pullRequest.number!,
  }
}
