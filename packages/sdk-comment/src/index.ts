import * as github from '@actions/github'

import { findCommentByCommentStamp, getPrContextFromGithubContext } from './github'
import { CreateOrUpdateReponse } from './github/types'
import { attachStampToBody, getFullStamp } from './stamp'

export type CommentOptions = {
  message: string
  githubToken: string
  uniqueAppId: string
  forceCreateNewComment?: boolean
}

/**
 * Create or update existing comment on a PR.
 * @param options.message - message to post
 * @param options.githubToken - token to use for connecting to the api
 * @param options.uniqueAppId - unique id that will be added (hidden) at the end of the message to allow later updates. Good example would be simply a name of your GitHub Action.
 * @param options.forceCreateNewComment - set to true if you don't want to update a comment but rather create a new one
 * @returns
 */
export async function createCommentOrUpdate({
  message,
  githubToken,
  forceCreateNewComment,
  uniqueAppId,
}: CommentOptions): Promise<CreateOrUpdateReponse> {
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

      return {
        status: 'updated',
      }
    }
  }
  await octokit.rest.issues.createComment({
    owner: prContext.owner,
    repo: prContext.repo,
    issue_number: prContext.pullRequestNumber,
    body,
  })

  return {
    status: 'created',
  }
}
