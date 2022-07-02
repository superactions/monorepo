import fetch, { Response } from 'node-fetch'
import stream from 'stream'

export class HttpClient {
  async post(url: string, body: any, authToken: string): Promise<{}> {
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        authorization: authToken,
      },
    })
    await handleFailures(response)

    return (await response.json()) as any
  }

  async stream(url: string): Promise<stream.Readable> {
    const response = await fetch(url, {
      method: 'GET',
    })
    await handleFailures(response)

    return (response.body as any)!
  }
}

async function handleFailures(response: Response): Promise<void> {
  if (!response.ok) {
    const text = await response.text()

    throw new Error(`API returned ${response.status} - ${text} while calling ${response.url}`)
  }
}
