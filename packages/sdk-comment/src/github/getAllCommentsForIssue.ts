import { PrContext } from './getPrContext'
import { GhComment, Octokit } from './types'

const PER_PAGE = 100

export async function getAllCommentsForPr(octokit: Octokit, prContext: PrContext): Promise<GhComment[]> {
  let allComments: GhComment[] = []

  let page = 0
  do {
    const { data: comments } = await octokit.rest.issues.listComments({
      owner: prContext.owner,
      repo: prContext.repo,
      issue_number: prContext.pullRequestNumber,
      per_page: PER_PAGE,
      page: page++,
    })
    allComments = allComments.concat(comments)
  } while (allComments.length === PER_PAGE)

  return allComments
}
