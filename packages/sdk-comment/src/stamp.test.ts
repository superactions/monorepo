import { expect } from 'earljs'

import { attachStampToBody, getFullStamp } from './stamp'

describe(getFullStamp.name, () => {
  it('returns a hidden tag', () => {
    expect(getFullStamp('unique-id')).toEqual('<!-- @superactions/comment/unique-id -->')
  })
})

describe(attachStampToBody.name, () => {
  it('attaches stamp to a body if it doesnt already contain it', () => {
    expect(attachStampToBody({ body: 'some body', uniqueId: 'once told me' })).toEqual(
      `some body
<!-- @superactions/comment/once told me -->`,
    )
  })

  it('doesnt duplicate stamp if body already contains it', () => {
    const body = `some body
<!-- @superactions/comment/once told me -->`
    expect(attachStampToBody({ body, uniqueId: 'once told me' })).toEqual(body)
  })
})
