import * as core from '@actions/core'
import * as github from '@actions/github'
import { LAYOUT, ProfilingResults, readJson } from '@deth-profiler/common'
import { diffByTestProfilingResults } from '@deth-profiler/profiler'
import * as artifact from '@superactions/artifact'
import { createCommentOrUpdate } from '@superactions/comment'
import path from 'path'

const context = github.context
const token = core.getInput('token')
const projectPath = core.getInput('projectPath')
const artifactClient = artifact.create({ ghToken: token })

const artifactKeyPrefix = 'deth:profiler'
const artifactKeys = {
  prefix: artifactKeyPrefix,
  results: `${artifactKeyPrefix}:results`,
  artifacts: `${artifactKeyPrefix}:artifacts`,
  diff: `${artifactKeyPrefix}:diff`,
  report: `${artifactKeyPrefix}:report`,
}

/**
 * GitHub (Super) Action profiling solidity code
 */
async function main(): Promise<void> {
  const results = await readJson<ProfilingResults>(path.join(projectPath, LAYOUT.RESULTS))
  const artifacts = await readJson<ProfilingResults>(path.join(projectPath, LAYOUT.ARTIFACTS))

  core.info('Uploading results')
  await artifactClient.uploadValue(artifactKeys.results, results)
  core.info('Uploading artifacts')
  await artifactClient.uploadValue(artifactKeys.artifacts, artifacts)
  core.info('Uploading html report')
  await artifactClient.uploadDirectory(artifactKeys.report, path.join(projectPath, LAYOUT.REPORT_FOLDER))

  if (context.eventName === 'pull_request') {
    core.info('Running on PR')

    const baseResults = await artifactClient.downloadValue<ProfilingResults>(artifactKeys.results)
    if (baseResults) {
      core.info('Found base results. Creating diff report.')

      const diffResults = diffByTestProfilingResults(baseResults.byTest, results.byTest)
      await artifactClient.uploadValue(artifactKeys.diff, diffResults)
    }
  }

  const url = artifactClient.getPageUrl(artifactKeys.report)
  const message = `[HTML Report](${url})`

  await createCommentOrUpdate({
    message,
    uniqueAppId: 'superactions/deth-profiler',
    githubToken: token,
  })
}

main().catch((e: Error) => {
  core.warning(e.stack!)
  core.setFailed(e)
})
