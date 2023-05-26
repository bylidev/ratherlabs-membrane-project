"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketOrderRequestAdapter = void 0;
class MarketOrderRequestAdapter {
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
            if (!request || !request.pairName || !request.side || !request.amount) {
                reject(new Error("Params: 'pairName', 'side' and 'amount' are required"));
            }
            if (request.side != 'buy' && request.side != 'sell') {
                reject(new Error("Param: 'side' must be 'buy' or 'sell'"));
            }
            resolve(request);
        });
    }
}
exports.MarketOrderRequestAdapter = MarketOrderRequestAdapter;
