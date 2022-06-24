import { FullStamp } from '../stamp'
import { getAllCommentsForPr } from './getAllCommentsForIssue'
import { PrContext } from './getPrContext'
import { GhComment, Octokit } from './types'

export async function findCommentByCommentStamp(
  octokit: Octokit,
  prContext: PrContext,
  stamp: FullStamp,
): Promise<GhComment | undefined> {
  const allComments = await getAllCommentsForPr(octokit, prContext)

  const comment = allComments.find((c) => c.body?.includes(stamp))

  return comment
}
