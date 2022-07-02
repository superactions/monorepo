import * as core from '@actions/core'
import * as github from '@actions/github'
import * as artifact from '@superactions/artifact'
import { createCommentOrUpdate } from '@superactions/comment'
import { statSync, writeFileSync } from 'fs'
import { join } from 'path'

const context = github.context
const token = core.getInput('token')
const artifactClient = artifact.create({ ghToken: token })

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
  Current size: ${currentSize}</br>
  Previous size: ${previousSize ?? 'unknown'}</br>
  Diff: ${diff ?? 'unknown'}
  `

  writeFileSync('/tmp/index.html', html)
  await artifactClient.uploadFile('lockfilesize.html', '/tmp/index.html')
  const url = artifactClient.getArtifactUrl('lockfilesize.html')

  const message = `Lockfile diff: \`${diff ?? 'unknown'}\`

  [HTML Report](${url})`

  await createCommentOrUpdate({
    message,
    uniqueAppId: 'superactions/example',
    githubToken: token,
  })
}

main().catch((e: Error) => {
  core.warning(e.stack!)
  core.setFailed(e)
})
