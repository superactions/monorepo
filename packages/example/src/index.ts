import * as core from '@actions/core'
import * as github from '@actions/github'
import * as artifact from '@superactions/artifact'
import { statSync, writeFileSync } from 'fs'
import { join } from 'path'

const context = github.context
const artifactClient = artifact.create()
const token = core.getInput('token')
const octokit = github.getOctokit(token)

type SizeArtifact = {
  size: number
}

/**
 * GitHub (Super) Action measuring size (in bytes) of a lockfile
 */
async function main(): Promise<void> {
  const artifactKey = 'lockFileSize'

  const { size } = statSync(join(__dirname, '../../../pnpm-lock.yaml'))

  core.info('Uploading artifact')
  await artifactClient.uploadValue(artifactKey, { size })

  if (context.eventName === 'pull_request') {
    core.info('Running on PR')

    const baseArtifact = await artifactClient.downloadValue<SizeArtifact>(artifactKey)
    let diff: number | undefined
    if (baseArtifact) {
      core.info('Found base artifact. Creating report.')

      diff = size - baseArtifact.size
    }

    return report(size, baseArtifact?.size, diff)
  }
}

async function report(currentSize: number, previousSize?: number, diff?: number): Promise<void> {
  const html = `
  <h1>Lockfile size report</h1>
  Current size: ${currentSize}
  Previous size: ${previousSize || 'unknown'}
  Diff: ${diff || 'unknown'}
  `

  writeFileSync('/tmp/index.html', html)
  await artifactClient.uploadFile('lockfilesize.html', '/tmp/index.html')
  const url = artifactClient.getArtifactUrl('lockfilesize.html')

  await comment(`Lockfile diff: \`${diff || 'unknown'}\`

[HTML Report](${url})`)
}

main().catch((e: Error) => {
  core.warning(e.stack!)
  core.setFailed(e)
})

// @todo add auto updating existing comment to this function and move to a separate package
async function comment(message: string): Promise<void> {
  const {
    payload: { pull_request, repository },
  } = github.context

  // ehh
  const { full_name: repoFullName } = repository!
  const [owner, repo] = repoFullName!.split('/')

  core.warning(owner)
  core.warning(repo)
  core.warning(JSON.stringify(pull_request))

  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_request?.number!,
    body: message,
  })
}
