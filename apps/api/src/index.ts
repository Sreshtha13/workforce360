import { createApp } from "./app";
import { env } from "./lib/env";
import { initSentry } from "./lib/sentry";
import { startScheduler } from "./jobs/scheduler";

initSentry();
const app = createApp();

app.listen(env.PORT, () => {
  console.log(
    `[api] Workforce 360 listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
  if (env.NODE_ENV !== "test") {
    startScheduler();
  }
});
