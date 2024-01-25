import * as express from 'express'
import {PercyConfig, PercySnapshot} from './schemas';
import { RunPercy } from './utils';
import {createServer} from 'http';
import {z} from "zod";
const port = 3778

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
    app.post('/percy/create-build',async (req,res)=>{
        const body = z.object({
            config:PercyConfig,
            snapshots: z.array(PercySnapshot)
        }).parse(req.body)
    })

    const server = createServer(app)
    return server.listen(port,'127.0.0.1')
}