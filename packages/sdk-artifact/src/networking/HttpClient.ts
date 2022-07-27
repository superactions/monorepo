import { delay } from 'bluebird'
import fetch, { Response } from 'node-fetch'
import * as stream from 'stream'

export class HttpClient {
  async post(url: string, body: any, authToken: string): Promise<{}> {
    return await retry(async () => {
      const response = await fetch(url, {
        method: 'POST',
        body,
        headers: {
          authorization: authToken,
        },
      })
      await handleFailures(response)

      return (await response.json()) as any
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
    } catch (e) {
      lastError = e

      await delay(retryDelay)
    }
  }

  throw lastError
}
