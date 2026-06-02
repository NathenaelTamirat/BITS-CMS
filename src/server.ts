import app from "./app.js";
import { env } from "./Utils/env.js";

app.listen(env.port, () => {
  console.log(`CMS API running on http://localhost:${env.port}`);
});
