"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressDriver = void 0;
const express_1 = __importDefault(require("express"));
const orderBookSnapshotAdapter_1 = require("./adapters/orderBookSnapshotAdapter");
const marketDataUseCaseImpl_1 = require("../../../core/useCases/marketDataUseCaseImpl");
const marketOrderRequestAdapter_1 = require("./adapters/marketOrderRequestAdapter");
const logger_1 = require("../../utils/logger");
const limitOrderRequestAdapter_1 = require("./adapters/limitOrderRequestAdapter");
class ExpressDriver {
    constructor(port, exchange) {
        this.port = port;
        this.exchange = exchange;
    }
    static with(args) {
        return new this(args.port, args.exchange);
    }
    execute() {
        const app = (0, express_1.default)();
        app.use(express_1.default.json());
        const port = this.port || 3000;
        app.get('/', (req, res) => {
            marketDataUseCaseImpl_1.MarketDataUseCaseImpl.with(this.exchange).getOrderBook(orderBookSnapshotAdapter_1.OrderBookSnapshotAdapter.with(req)).then((orderBook) => {
                res.status(200).send(orderBook);
            }).catch((err) => {
                res.status(400).send(err.message);
            });
        });
        app.post('/order', (req, res) => {
            if (req.body.limit) {
                marketDataUseCaseImpl_1.MarketDataUseCaseImpl.with(this.exchange).getMarketLimitOperationCost(limitOrderRequestAdapter_1.MarketLimitOrderRequestAdapter.with(req)).then((marketOrderResponse) => {
                    res.status(200).send(marketOrderResponse);
                }).catch((err) => {
                    res.status(400).send(err.message);
                });
            }
            else {
                marketDataUseCaseImpl_1.MarketDataUseCaseImpl.with(this.exchange).getMarketOperationCost(marketOrderRequestAdapter_1.MarketOrderRequestAdapter.with(req)).then((marketOrderResponse) => {
                    res.status(200).send(marketOrderResponse);
                }).catch((err) => {
                    res.status(400).send(err.message);
                });
            }
        });
        this.server = app.listen(port, () => {
            logger_1.logger.info(`HTTP server listening at http://localhost:${port}`);
        });
        return app;
    }
    close() {
        var _a;
        (_a = this.server) === null || _a === void 0 ? void 0 : _a.close();
        logger_1.logger.info(`HTTP server http://localhost:${this.port} closed.`);
    }
}
exports.ExpressDriver = ExpressDriver;
