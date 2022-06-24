import { expect } from 'earljs'

import { fixtures } from './__fixtures'
import { getPrContextFromGithubContext } from './getPrContext'

describe(getPrContextFromGithubContext.name, () => {
  it('extracts context from PR event', () => {
    const context = getPrContextFromGithubContext(fixtures.prContext)

    expect(context).toEqual({
      owner: 'superactions',
      repo: 'monorepo',
      pullRequestNumber: 1,
    })
  })

  it('returns undefined when not on PR', () => {
    const context = getPrContextFromGithubContext(fixtures.pushContext)

    expect(context).toEqual(undefined)
  })
})
