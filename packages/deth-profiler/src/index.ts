import * as core from '@actions/core'
import * as github from '@actions/github'
import { LAYOUT, ProfilingResults, readJson, SourceCodes } from '@deth-profiler/common'
import { diffByTestProfilingResults, generateHtmlReport } from '@deth-profiler/profiler'
import * as artifact from '@superactions/artifact'
import { createCommentOrUpdate } from '@superactions/comment'
import path from 'path'

const context = github.context
const token = core.getInput('token')
const projectPath = path.resolve(core.getInput('project-path'))
const artifactClient = artifact.create({ ghToken: token })

const artifactKeyPrefix = 'deth/profiler'
const artifactKeys = {
  prefix: artifactKeyPrefix,
  results: `${artifactKeyPrefix}/results`,
  artifacts: `${artifactKeyPrefix}/artifacts`,
  diff: `${artifactKeyPrefix}/diff`,
  report: `${artifactKeyPrefix}/report`,
}

/**
 * GitHub (Super) Action profiling solidity code
 */
async function main(): Promise<void> {
  const results = await readJson<ProfilingResults>(path.join(projectPath, LAYOUT.RESULTS))
  const artifacts = await readJson<SourceCodes>(path.join(projectPath, LAYOUT.ARTIFACTS))

  core.info('Uploading results')
  await artifactClient.uploadValue(artifactKeys.results, results)
  core.info('Uploading artifacts')
  await artifactClient.uploadValue(artifactKeys.artifacts, artifacts)

  const viewReportHydrationData = { results: results.byTest, sourceCodes: artifacts }
  let diffReportHydrationData

  if (context.eventName === 'pull_request') {
    core.info('Running on PR')

    const baseResults = await artifactClient.downloadValue<ProfilingResults>(artifactKeys.results)
    if (baseResults) {
      core.info('Found base results')

      const diffResults = diffByTestProfilingResults(baseResults.byTest, results.byTest)
      core.info('Uploading diff results')
      await artifactClient.uploadValue(artifactKeys.diff, diffResults)

      diffReportHydrationData = { diff: diffResults, sourceCodes: artifacts }
    }
  }

  core.info('Generating html report')
  await generateHtmlReport(artifactKeys.report, viewReportHydrationData, diffReportHydrationData)

  core.info('Uploading html report')
  await artifactClient.uploadDirectory(artifactKeys.report, path.join(projectPath, LAYOUT.REPORT_FOLDER))

  const url = artifactClient.getPageUrl(artifactKeys.report)
  let message = `[Profiling Report](${url}/view.html)`
  if (diffReportHydrationData) {
    message += `\n[Diff Report](${url}/diff.html)`
  }

  core.info('Creating or updating GH comment')
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
