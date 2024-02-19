import express from 'express';
import { pino } from 'pino';

import { getDbConnection } from '../db/init';

const app = express();

const logger = pino();

app.listen(3000, () => {
  getDbConnection();
  logger.info(`Listening on port ${3000}`);
});

