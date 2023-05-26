"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bitfinex = void 0;
const ws_1 = require("ws");
const rxjs_1 = require("rxjs");
const crc_32_1 = __importDefault(require("crc-32"));
const lodash_1 = __importDefault(require("lodash"));
const logger_1 = require("../../../../infrastructure/utils/logger");
class Bitfinex {
    constructor() {
        this.GET_ORDER_BOOK_URL = "https://api-pub.bitfinex.com/v2/book/{pairName}/P0";
        this.GET_ORDER_BOOK_WS = "wss://api-pub.bitfinex.com/ws/2";
    }
    static getInstance() {
        if (!Bitfinex.instance) {
            Bitfinex.instance = new Bitfinex();
        }
        return Bitfinex.instance;
    }
    getOrderBook(req) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            const ticker = (_a = req.pairName) === null || _a === void 0 ? void 0 : _a.toString().replace("-", "").toUpperCase();
            params.append('len', req.depth.toString());
            const url = new URL(this.GET_ORDER_BOOK_URL.replace("{pairName}", `t${ticker}`));
            url.search = params.toString();
            return fetch(url).then((res) => {
                return res.json();
            }).then((json) => {
                if (json[0] == "error") {
                    throw new Error(json[2]);
                }
                const resJson = json;
                return this.orderBookResponseToOrderBookUpdates(resJson);
            }).catch((err) => {
                logger_1.logger.error(`Error getting order book from Bitfinex: ${err}`);
                throw err;
            });
        });
    }
    orderBookResponseToOrderBookUpdates(data) {
        return data.reduce((result, [precio, cantidad, tipo]) => {
            const entry = { amount: cantidad, count: 1, price: precio };
            if (tipo > 0) {
                result.bids = result.bids ? [...result.bids, entry] : [entry];
            }
            else {
                result.asks = result.asks ? [...result.asks, entry] : [entry];
            }
            return result;
        }, {});
    }
    subscribeOrderBookUpdates(req) {
        var _a;
        if (!req.depth || req.depth == 1) {
            throw new Error("Depth 1 fails on Bitfinex websocket because possible bug.");
        }
        // connect to websocket
        const ws = new ws_1.WebSocket(this.GET_ORDER_BOOK_WS);
        const observer = new rxjs_1.BehaviorSubject({ bids: [], asks: [] });
        const ticker = (_a = req.pairName) === null || _a === void 0 ? void 0 : _a.toString().replace("-", "").toUpperCase();
        const BOOK = { bids: {}, asks: {}, psnap: {}, mcnt: 0 };
        ws.on('open', () => {
            // send websocket conf event with checksum flag
            ws.send(JSON.stringify({ event: 'conf', flags: 131072 }));
            // send subscribe to get desired book updates
            ws.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: 't' + ticker, prec: 'P0', len: req.depth }));
        });
        ws.on('message', (msg) => {
            msg = JSON.parse(msg);
            if (msg.event)
                return;
            if (msg[1] === 'hb')
                return;
            // if msg contains checksum, perform checksum
            if (msg[1] === 'cs') {
                const checksum = msg[2];
                const csdata = [];
                const bidsKeys = BOOK.psnap['bids'];
                const asksKeys = BOOK.psnap['asks'];
                // collect all bids and asks into an array
                for (let i = 0; i < 25; i++) {
                    if (bidsKeys[i]) {
                        const price = bidsKeys[i];
                        const pp = BOOK.bids[price];
                        csdata.push(pp.price, pp.amount);
                    }
                    if (asksKeys[i]) {
                        const price = asksKeys[i];
                        const pp = BOOK.asks[price];
                        csdata.push(pp.price, -pp.amount);
                    }
                }
                // create string of array to compare with checksum
                const csStr = csdata.join(':');
                const csCalc = crc_32_1.default.str(csStr);
                if (csCalc !== checksum) {
                    logger_1.logger.fatal(`Bitfinex order book checksum failed for market ${req.pairName} with checksum: ${checksum} and calculated checksum: ${csCalc}`);
                    process.exit(-1);
                }
                else {
                    logger_1.logger.debug('Checksum: ' + checksum + ' success!');
                    observer.next(this.getOrderBookResponse(BOOK));
                }
                return;
            }
            // handle book. create book or update/delete price points
            if (BOOK.mcnt === 0) {
                lodash_1.default.each(msg[1], function (pp) {
                    pp = { price: pp[0], count: pp[1], amount: pp[2] };
                    const side = pp.amount >= 0 ? 'bids' : 'asks';
                    pp.amount = Math.abs(pp.amount);
                    BOOK[side][pp.price] = pp;
                });
            }
            else {
                msg = msg[1];
                const pp = { price: msg[0], count: msg[1], amount: msg[2] };
                // if count is zero, then delete price point
                if (!pp.count) {
                    let found = true;
                    if (pp.amount > 0) {
                        if (BOOK['bids'][pp.price]) {
                            delete BOOK['bids'][pp.price];
                        }
                        else {
                            found = false;
                        }
                    }
                    else if (pp.amount < 0) {
                        if (BOOK['asks'][pp.price]) {
                            delete BOOK['asks'][pp.price];
                        }
                        else {
                            found = false;
                        }
                    }
                    if (!found) {
                        logger_1.logger.fatal(`Bitfinex order book update failed for market ${req.pairName} with price point: ${JSON.stringify(pp)}`);
                    }
                }
                else {
                    // else update price point
                    const side = pp.amount >= 0 ? 'bids' : 'asks';
                    pp.amount = Math.abs(pp.amount);
                    BOOK[side][pp.price] = pp;
                }
                // save price snapshots. Checksum relies on psnaps!
                lodash_1.default.each(['bids', 'asks'], function (side) {
                    const sbook = BOOK[side];
                    const bprices = Object.keys(sbook);
                    const prices = bprices.sort(function (a, b) {
                        if (side === 'bids') {
                            return +a >= +b ? -1 : 1;
                        }
                        else {
                            return +a <= +b ? -1 : 1;
                        }
                    });
                    BOOK.psnap[side] = prices;
                });
            }
            BOOK.mcnt++;
        });
        return observer;
    }
    getOrderBookResponse(req) {
        return {
            bids: Object.values(req.bids),
            asks: Object.values(req.asks)
        };
    }
}
exports.Bitfinex = Bitfinex;
