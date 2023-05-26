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
exports.MockedExchange = void 0;
const rxjs_1 = require("rxjs");
const orderbookResponse_1 = require("../../../../core/domain/orderbookResponse");
class MockedExchange {
    constructor() {
    }
    static getInstance() {
        if (!MockedExchange.instance) {
            MockedExchange.instance = new MockedExchange();
        }
        return MockedExchange.instance;
    }
    getOrderBook(req) {
        return __awaiter(this, void 0, void 0, function* () {
            if (req.pairName === "BTC-USD" || req.pairName === "ETH-USD") {
                const dummyBook = new orderbookResponse_1.SyncronizedOrderBook();
                dummyBook.bids = [{ amount: 1.5, price: 2.5, count: 3.5 }, { amount: 1, price: 2, count: 3 }];
                dummyBook.asks = [{ amount: 4, price: 5, count: 6 }, { amount: 4.5, price: 5.5, count: 6.5 }];
                return dummyBook;
            }
            else {
                throw new Error("pairName not supported");
            }
            ;
        });
    }
    subscribeOrderBookUpdates(req) {
        return new rxjs_1.Observable((subscriber) => {
            if (req.pairName === "BTC-USD" || req.pairName === "ETH-USD") {
                const dummyBook = new orderbookResponse_1.SyncronizedOrderBook();
                dummyBook.bids = [{ amount: 7, price: 8, count: 9 }];
                dummyBook.asks = [{ amount: 10, price: 11, count: 12 }];
                subscriber.next(dummyBook);
            }
            else {
                subscriber.error("pairName not supported");
            }
            ;
        });
    }
}
exports.MockedExchange = MockedExchange;
