import * as github from '@actions/github'

import { getPrContextFromGithubContext } from './github'

export type CommentOptions = { message: string; githubToken: string; uniqueId: string; forceCreateNewComment: boolean }

export async function comment({ message, githubToken }: CommentOptions): Promise<void> {
  const octokit = github.getOctokit(githubToken)
  const commentContext = getPrContextFromGithubContext(github.context)
  if (!commentContext) {
    throw new Error("Can't find PR info. Are you running in PR context?")
  }

  await octokit.rest.issues.createComment({
    owner: commentContext.owner,
    repo: commentContext.repo,
    issue_number: commentContext.pullRequestNumber,
    body: message,
  })
}
