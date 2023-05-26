"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookSnapshotAdapter = void 0;
class OrderBookSnapshotAdapter {
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
            if (!this.req.pairName || !this.req.depth) {
                reject(new Error("Params: 'pairName' and 'depth' are required"));
            }
            resolve({ pairName: this.req.pairName, depth: this.req.depth });
        });
    }
}
exports.OrderBookSnapshotAdapter = OrderBookSnapshotAdapter;
