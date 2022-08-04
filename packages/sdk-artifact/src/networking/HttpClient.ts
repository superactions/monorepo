import * as core from '@actions/core'
import { delay } from 'bluebird'
import fetch, { Response } from 'node-fetch'
import * as stream from 'stream'

export class HttpClient {
  // note: we require function returning body to make retry work with streams etc.
  async post(url: string, bodyFn: () => any, authToken: string): Promise<{}> {
    return await retry(async () => {
      core.debug(`Calling: ${url}`)
      const response = await fetch(url, {
        method: 'POST',
        body: bodyFn(),
        headers: {
          authorization: authToken,
        },
      })
      await handleFailures(response)
      const responseJson = (await response.json()) as any

      core.debug(`Successfully called ${url}`)

      return responseJson
    })
  }

  async stream(url: string): Promise<stream.Readable> {
    return await retry(async () => {
      const response = await fetch(url, {
        method: 'GET',
      })
      await handleFailures(response)

      return (response.body as any)!
    })
  }
}

async function handleFailures(response: Response): Promise<void> {
  if (!response.ok) {
    const text = await response.text()

    throw new Error(`API returned ${response.status} - ${text} while calling ${response.url}`)
  }
}

async function retry<T>(asyncFn: () => Promise<T>, retryNo = 5, retryDelay = 1000): Promise<T> {
  let remainingRetries = retryNo
  let lastError: any

  while (remainingRetries-- > 0) {
    try {
      return await asyncFn()
    } catch (e: any) {
      // do not retry on 404
      if (e.message.includes(404)) {
        throw e
      }

      core.warning(`Failed with ${e.message}`)
      lastError = e

      const randomizeDelay = Math.random() * retryDelay + 0.5 * retryDelay // randomize delay
      const backOffDelay = randomizeDelay * (retryNo - remainingRetries) // the more failures the more delay
      core.warning(`Retry in ${backOffDelay}!`)

      await delay(backOffDelay)
    }
  }

  throw lastError
}
