import * as github from '@actions/github'

import { findCommentByCommentStamp, getPrContextFromGithubContext } from './github'
import { attachStampToBody, getFullStamp } from './stamp'

export type CommentOptions = {
  message: string
  githubToken: string
  uniqueAppId: string
  forceCreateNewComment?: boolean
}

export async function createCommentOrUpdate({
  message,
  githubToken,
  forceCreateNewComment,
  uniqueAppId,
}: CommentOptions): Promise<void> {
  const octokit = github.getOctokit(githubToken)
  const prContext = getPrContextFromGithubContext(github.context)
  if (!prContext) {
    throw new Error("Can't find PR info. Are you running in PR context?")
  }

  const body = attachStampToBody({ uniqueId: uniqueAppId, body: message })

  if (!forceCreateNewComment) {
    // try updating an already existing comment
    const commentToUpdate = await findCommentByCommentStamp(octokit, prContext, getFullStamp(uniqueAppId))

    if (commentToUpdate) {
      await octokit.rest.issues.updateComment({
        owner: prContext.owner,
        repo: prContext.repo,
        comment_id: commentToUpdate.id,
        body,
      })
      return
    }
  }
  await octokit.rest.issues.createComment({
    owner: prContext.owner,
    repo: prContext.repo,
    issue_number: prContext.pullRequestNumber,
    body,
  })
}
