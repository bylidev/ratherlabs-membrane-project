"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bitfinex_1 = require("./infrastructure/driven/exchanges/bitfinex/bitfinex");
const expressDriver_1 = require("./infrastructure/drivers/http/expressDriver");
expressDriver_1.ExpressDriver.with({
    port: 3005,
    exchange: bitfinex_1.Bitfinex.getInstance()
}).execute();
