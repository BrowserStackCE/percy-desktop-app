import * as express from "express";
import { PercyConfig } from "./schemas";
import { RunPercy } from "./utils";
import { createServer } from "http";
const port = 3778;

export function StartExpressServer() {
  const app = express();
  app.use(express.json({ limit: "200mb" }));
  app.post("/percy/start", async (req, res, next) => {
    (async () => {
      const percyExtensionData = req.body;
      const build = percyExtensionData.build;
      const preferences = percyExtensionData.preferences;
      const discoveryOptions = percyExtensionData.discoveryOptions;

      console.log("Req.Body :", req.body);
      console.log("Received build:", build);
      console.log("Received preferences:", preferences);
      console.log("Received discoveryOptions:", discoveryOptions);
      res.sendStatus(200);
    })().catch(next);
  });

  const server = createServer(app);
  return server.listen(port, "127.0.0.1");
}
