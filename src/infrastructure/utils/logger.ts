import { pino } from 'pino';

export const logger = pino({
  name: 'membrane',
  level: 'info',
});
