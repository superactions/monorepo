import * as github from '@actions/github'

export type Octokit = ReturnType<typeof github.getOctokit>
export type GhComment = Awaited<ReturnType<Octokit['rest']['issues']['listComments']>>['data'][number]
