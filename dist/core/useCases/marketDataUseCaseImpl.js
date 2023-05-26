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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketDataUseCaseImpl = void 0;
const logger_1 = require("../../infrastructure/utils/logger");
const orderBookSnapshotAdapter_1 = require("../../infrastructure/drivers/http/adapters/orderBookSnapshotAdapter");
class MarketDataUseCaseImpl {
    constructor(exchange) {
        this.exchange = exchange;
    }
    static with(exchange) {
        return new this(exchange);
    }
    getOrderBook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderBookRequest = yield req.adapt();
            const pairName = orderBookRequest.pairName;
            const depth = orderBookRequest.depth;
            if (!pairName || !depth) {
                logger_1.logger.debug(`Missing required parameters: pairName: ${pairName} depth: ${depth}`);
                throw new Error("pairName and depth are required");
            }
            logger_1.logger.info(`[getOrderBook] called with market:${orderBookRequest.pairName} and depth:${orderBookRequest.depth}`);
            //if orderBookMap does not contain the pairName, then it is not subscribed to WSS updates.
            const cachedKey = pairName + depth;
            if (!MarketDataUseCaseImpl.orderBookMap.get(cachedKey)) {
                logger_1.logger.debug(`[getOrderBook] creating cached key: ${cachedKey}`);
                MarketDataUseCaseImpl.orderBookMap.set(cachedKey, {});
                //also cheks if pairName is supported by the exchange.
                const resp = yield this.exchange.getOrderBook(orderBookRequest);
                logger_1.logger.info(`[getOrderBook] subscribing to orderBookUpdates for market:${pairName} and depth:${depth}`);
                this.subscribeOrderBookUpdates(req).then(obs => {
                    obs.subscribe((orderBookUpdates) => {
                        logger_1.logger.debug(`[getOrderBook] received an update for market:${pairName} and depth:${depth}`);
                        MarketDataUseCaseImpl.orderBookMap.delete(cachedKey);
                        MarketDataUseCaseImpl.orderBookMap.set(cachedKey, orderBookUpdates);
                    });
                }).catch(error => {
                    logger_1.logger.error(`[getOrderBook] error subscribing to orderBookUpdates for market:${pairName} and depth:${depth}. Details: ${error}`);
                });
                return resp;
            }
            else {
                logger_1.logger.debug(`[getOrderBook] returning cached key: ${cachedKey}`);
                return MarketDataUseCaseImpl.orderBookMap.get(cachedKey);
            }
        });
    }
    subscribeOrderBookUpdates(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const orderBookRequest = yield req.adapt();
            if (!orderBookRequest.pairName || !orderBookRequest.depth) {
                throw new Error("[subscribeOrderBookUpdates] pairName and depth are required");
            }
            return this.exchange.subscribeOrderBookUpdates(orderBookRequest);
        });
    }
    getMarketLimitOperationCost(req) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield req.adapt();
            const orderBook = yield this.getOrderBook(orderBookSnapshotAdapter_1.OrderBookSnapshotAdapter.with({ depth: 250, pairName: request.pairName }));
            let filledQty = 0;
            let effectivePrice = 0;
            const bookSide = request.side === 'buy' ? 'asks' : 'bids';
            logger_1.logger.info(`request side: ${request.side} limitPrice: ${request.limit} pairName: ${request.pairName}`);
            logger_1.logger.info(`available qty price ${bookSide} ${(_a = orderBook[bookSide]) === null || _a === void 0 ? void 0 : _a.reduce((sum, bid) => sum + bid.price, 0)}`);
            const book = orderBook[bookSide];
            // bids sorted desc and asks sorted asc
            for (const order of book) {
                const qtyToOperate = ((request.limit - effectivePrice) - order.price * order.amount) >= 0 ? order.amount : ((request.limit - effectivePrice) / order.price);
                filledQty += qtyToOperate;
                effectivePrice += order.price * qtyToOperate;
                logger_1.logger.info(`order price: ${order.price} order amount: ${order.amount} qtyToOperate: ${qtyToOperate} filledQty: ${filledQty} effectivePrice: ${effectivePrice}`);
                if (effectivePrice >= request.limit) {
                    break;
                }
            }
            const marketOrderResponse = {
                filled_qty: filledQty,
                effective_price: effectivePrice,
                symbol: request.pairName,
            };
            return Promise.resolve(marketOrderResponse);
        });
    }
    getMarketOperationCost(req) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const request = yield req.adapt();
            const orderBook = yield this.getOrderBook(orderBookSnapshotAdapter_1.OrderBookSnapshotAdapter.with({ depth: 250, pairName: request.pairName }));
            let filledQty = 0;
            let effectivePrice = 0;
            const bookSide = request.side === 'buy' ? 'asks' : 'bids';
            logger_1.logger.info(`request side: ${request.side} qty: ${request.amount} pairName: ${request.pairName}`);
            logger_1.logger.info(`available qty in ${bookSide} ${(_a = orderBook[bookSide]) === null || _a === void 0 ? void 0 : _a.reduce((sum, bid) => sum + bid.amount, 0)}`);
            const book = orderBook[bookSide];
            // bids sorted desc and asks sorted asc
            for (const order of book) {
                const qtyToOperate = (order.amount - (request.amount - filledQty)) >= 0 ? request.amount - filledQty : order.amount;
                filledQty += qtyToOperate;
                effectivePrice += order.price * qtyToOperate;
                logger_1.logger.info(`order price: ${order.price} order amount: ${order.amount} qtyToOperate: ${qtyToOperate} filledQty: ${filledQty} effectivePrice: ${effectivePrice}`);
                if (filledQty > request.amount) {
                    break;
                }
            }
            const marketOrderResponse = {
                filled_qty: filledQty,
                remaining_qty: request.amount - filledQty,
                effective_price: effectivePrice,
                symbol: request.pairName,
            };
            return Promise.resolve(marketOrderResponse);
        });
    }
}
MarketDataUseCaseImpl.orderBookMap = new Map();
exports.MarketDataUseCaseImpl = MarketDataUseCaseImpl;
