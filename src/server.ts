import * as express from 'express'
import { PercyConfig } from './schemas';
import { RunPercy } from './utils';
import {createServer} from 'http';
const port = 64360

export function StartExpressServer() {
    const app = express()
    app.use(express.json())
    app.post('/percy/start', async (req, res, next) => {
        (async () => {
            const body = PercyConfig.parse(req.body)
            await RunPercy(body)
            res.sendStatus(200)
        })().catch(next)

    })

    const server = createServer(app)
    return server.listen(port,'127.0.0.1')
}