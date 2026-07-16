import { createApp } from "./app";
import { env } from "./lib/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(
    `[api] Workforce 360 listening on http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
});
