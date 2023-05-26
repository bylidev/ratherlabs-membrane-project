"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketLimitOrderRequestAdapter = void 0;
class MarketLimitOrderRequestAdapter {
    constructor(req) {
        this.req = req;
    }
    static with(req) {
        if (req.query) {
            return new this(req.query);
        }
        else if (req.body) {
            return new this(req.body);
        }
        else {
            return new this(req);
        }
    }
    adapt() {
        return new Promise((resolve, reject) => {
            const request = this.req;
            if (!request || !request.limit || !request.side || !request.pairName) {
                reject(new Error("Params: 'limit','side','pairName' are required"));
            }
            if (request.side != 'buy' && request.side != 'sell') {
                reject(new Error("Param: 'side' must be 'buy' or 'sell'"));
            }
            resolve(request);
        });
    }
}
exports.MarketLimitOrderRequestAdapter = MarketLimitOrderRequestAdapter;
