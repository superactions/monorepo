export type CommitContext =
  | {
      event: 'pull-request'
      baseSha: string
      headSha: string
    }
  | {
      event: 'push'
      headSha: string
    }

export function extractCommitContext(event: any): CommitContext {
  if (event?.eventName === 'pull_request') {
    const baseSha = event?.payload?.pull_request?.base?.sha
    if (!baseSha) {
      throw new Error(`Can't read base sha! ${JSON.stringify(event)}`)
    }
    const headSha = event?.payload?.pull_request?.head?.sha
    if (!headSha) {
      throw new Error(`Can't read head sha! ${JSON.stringify(event)}`)
    }

    return {
      event: 'pull-request',
      baseSha,
      headSha,
    }
  }

  if (event?.eventName === 'push') {
    const headSha = event?.sha
    if (!headSha) {
      throw new Error(`Can't read head sha! ${JSON.stringify(event)}`)
    }
    return {
      event: 'push',
      headSha,
    }
  }

  throw new Error(`Couldn't recognize context ${JSON.stringify(event)}`)
}
