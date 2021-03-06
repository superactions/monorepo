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

  core.info('Commit context: ' + JSON.stringify((artifactClient as any).artifactsApi.commitContext)) // log detailed data about execution
  if (context.eventName === 'pull_request') {
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
  const index = `
  <html>
  <head>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
  <h1>Lockfile size report</h1>
  Current size: ${currentSize}</br>
  Previous size: ${previousSize ?? 'unknown'}</br>
  Diff: ${diff ?? 'unknown'}
  </body>
  </html>
  `
  const styles = `
  body {
    font-family: "Lucida Console", "Courier New", monospace;
    background-color: 0D0208;
    color: #008F11;
  }
  `
  writeFileSync('/tmp/index.html', index)
  writeFileSync('/tmp/styles.css', styles)
  await artifactClient.uploadFile('lockfile-report/index.html', '/tmp/index.html')
  await artifactClient.uploadFile('lockfile-report/styles.css', '/tmp/styles.css')

  const url = artifactClient.getPageUrl('lockfile-report')

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
