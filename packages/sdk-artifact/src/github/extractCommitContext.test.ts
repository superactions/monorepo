import { expect } from 'earljs'

import { fixtures } from './__fixtures'
import { extractCommitContext } from './extractCommitContext'

describe(extractCommitContext.name, () => {
  it('extracts context from PR event', () => {
    const event = fixtures.prContext

    const context = extractCommitContext(event)

    expect(context).toEqual({
      event: 'pull-request',
      baseSha: '76347b2dbada2d1b0fba',
      headSha: '6ba41a4fc808534ef47f',
    })
  })

  it('extracts context from push event', () => {
    const event = fixtures.pushContext

    const context = extractCommitContext(event)

    expect(context).toEqual({
      event: 'push',
      headSha: 'f728831edb7fdee0db93',
    })
  })
})
