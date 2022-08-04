import { expect } from 'earljs'
import urlJoin from 'url-join'

import { DummyServer, streamToString } from './__test'
import { HttpClient } from './HttpClient'

describe(HttpClient.name, () => {
  describe(HttpClient.prototype.stream.name, () => {
    let server: DummyServer
    beforeEach(async () => {
      server = new DummyServer()
      await server.start()
    })
    afterEach(() => server.stop())

    it('streams response', async () => {
      const httpClient = new HttpClient()

      const response = await httpClient.stream(urlJoin(server.url, 'example'))

      expect(await streamToString(response)).toEqual('Hello World')
    })

    it('does not retry 404s', async function () {
      // eslint-disable-next-line @typescript-eslint/no-invalid-this
      this.timeout(1_000) // if retries happen this test won't be able to finish in 1 second

      const httpClient = new HttpClient()

      await expect(httpClient.stream(urlJoin(server.url, 'not-existing'))).toBeRejected(expect.stringMatching('404'))
    })
  })
})
