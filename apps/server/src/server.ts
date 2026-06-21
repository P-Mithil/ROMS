import "./config/env.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`ROMS API listening on http://localhost:${env.PORT}`);
  console.log(`Health check: http://localhost:${env.PORT}/api/v1/health`);
});
