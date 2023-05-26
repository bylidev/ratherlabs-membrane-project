import { Server } from 'http';
import { Driver } from '../driver';
import express from 'express';
import { OrderBookSnapshotAdapter } from './adapters/orderBookSnapshotAdapter';
import { MarketDataUseCaseImpl } from '../../../core/useCases/marketDataUseCaseImpl';
import { Express } from 'express';
import { Exchange } from '../../../core/ports/outbound/exchange';
import { MarketOrderRequestAdapter } from './adapters/marketOrderRequestAdapter';
import { logger } from '../../utils/logger';
import { MarketLimitOrderRequestAdapter } from './adapters/limitOrderRequestAdapter';

export class ExpressDriver implements Driver<Express> {
  private port: number;
  private server?: Server;
  private exchange: Exchange;

  private constructor(port: number, exchange: Exchange) {
    this.port = port;
    this.exchange = exchange;
  }

  static with(args: { port: number; exchange: Exchange }): ExpressDriver {
    return new this(args.port, args.exchange);
  }

  execute(): Express {
    const app = express();
    app.use(express.json());

    const port = this.port || 3000;

    app.get('/', (req, res) => {
      MarketDataUseCaseImpl.with(this.exchange)
        .getOrderBook(OrderBookSnapshotAdapter.with(req))
        .then((orderBook) => {
          res.status(200).send(orderBook);
        })
        .catch((err) => {
          res.status(400).send(err.message);
        });
    });

    app.post('/order', (req, res) => {
      if (req.body.limit) {
        MarketDataUseCaseImpl.with(this.exchange)
          .getMarketLimitOperationCost(MarketLimitOrderRequestAdapter.with(req))
          .then((marketOrderResponse) => {
            res.status(200).send(marketOrderResponse);
          })
          .catch((err) => {
            res.status(400).send(err.message);
          });
      } else {
        MarketDataUseCaseImpl.with(this.exchange)
          .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
          .then((marketOrderResponse) => {
            res.status(200).send(marketOrderResponse);
          })
          .catch((err) => {
            res.status(400).send(err.message);
          });
      }
    });

    this.server = app.listen(port, () => {
      logger.info(`HTTP server listening at http://localhost:${port}`);
    });
    return app;
  }

  close(): void {
    this.server?.close();
    logger.info(`HTTP server http://localhost:${this.port} closed.`);
  }
}
