// src/server.ts

import "dotenv/config";

import "./database/database.js";

import { app } from "./app.js";
import { startBillingCron } from "./cron/billingCron.js";

const port = process.env.PORT || 3333;

app.listen(port, () => {
  console.log(`🚀 MenuFlow API rodando na porta ${port}`);

  startBillingCron();
});