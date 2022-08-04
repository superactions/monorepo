import express from 'express'
import getPort from 'get-port'
import * as http from 'http'

export class DummyServer {
  public port!: number
  public url!: string

  private readonly app = express()
  private server!: http.Server

  async start(): Promise<void> {
    this.app.get('/example', function (_req, res) {
      res.send('Hello World')
    })

    this.port = await getPort()
    this.url = `http://localhost:${this.port}/`
    this.server = this.app.listen(this.port)
  }

  stop(): void {
    this.server.close()
  }
}
