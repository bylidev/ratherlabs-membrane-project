import { Bitfinex } from './infrastructure/driven/exchanges/bitfinex/bitfinex';
import { ExpressDriver } from './infrastructure/drivers/http/expressDriver';

ExpressDriver.with({
  port: 3005,
  exchange: Bitfinex.getInstance(),
}).execute();
