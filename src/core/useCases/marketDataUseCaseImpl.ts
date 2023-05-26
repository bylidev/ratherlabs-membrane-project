import { SyncronizedOrderBook } from '../domain/orderbookResponse';
import { Exchange } from '../ports/outbound/exchange';
import { OrderBookSnapshotRequest } from '../domain/orderBookRequest';
import { MarketDataUseCases } from './marketDataUseCase';
import { BehaviorSubject, Observable } from 'rxjs';
import { InboundPort } from '../ports/inbound/inbound';
import { MarketOrderRequest } from '../domain/marketOrderRequest';
import { MarketOrderResponse } from '../domain/marketOrderResponse';
import { logger } from '../../infrastructure/utils/logger';
import { OrderBookSnapshotAdapter } from '../../infrastructure/drivers/http/adapters/orderBookSnapshotAdapter';
import { LimitOrderRequest } from '../domain/limitOrderRequest';
import * as dotenv from 'dotenv';

dotenv.config();
const EFFECTIVE_PRICE_MARKET_DEPTH =
  process.env.EFFECTIVE_PRICE_MARKET_DEPTH || 250;
export class MarketDataUseCaseImpl implements MarketDataUseCases {
  static orderBookMap: Map<string, SyncronizedOrderBook | undefined> = new Map<
    string,
    SyncronizedOrderBook | undefined
  >();
  private exchange: Exchange;

  private constructor(exchange: Exchange) {
    this.exchange = exchange;
  }

  static with(exchange: Exchange): MarketDataUseCaseImpl {
    return new this(exchange);
  }

  async getOrderBook(
    req: InboundPort<OrderBookSnapshotRequest>
  ): Promise<SyncronizedOrderBook> {
    const orderBookRequest = await req.adapt();
    const pairName = orderBookRequest.pairName;
    const depth = orderBookRequest.depth;

    if (!pairName || !depth) {
      logger.debug(
        `Missing required parameters: pairName: ${pairName} depth: ${depth}`
      );
      throw new Error('pairName and depth are required');
    }

    logger.info(
      `[getOrderBook] called with market:${orderBookRequest.pairName} and depth:${orderBookRequest.depth}`
    );

    //if orderBookMap does not contain the pairName, then it is not subscribed to WSS updates.
    const cachedKey = pairName + depth;
    if (!MarketDataUseCaseImpl.orderBookMap.get(cachedKey)) {
      //also cheks if pairName is supported by the exchange.
      const resp: SyncronizedOrderBook = await this.exchange.getOrderBook(
        orderBookRequest
      );
      logger.debug(`[getOrderBook] creating cached key: ${cachedKey}`);
      MarketDataUseCaseImpl.orderBookMap.set(cachedKey, resp);
      logger.info(
        `[getOrderBook] subscribing to orderBookUpdates for market:${pairName} and depth:${depth}`
      );
      this.subscribeOrderBookUpdates(req)
        .then((obs) => {
          obs.subscribe((orderBookUpdates) => {
            logger.debug(
              `[getOrderBook] received an update for market:${pairName} and depth:${depth}`
            );
            MarketDataUseCaseImpl.orderBookMap.delete(cachedKey);
            MarketDataUseCaseImpl.orderBookMap.set(cachedKey, orderBookUpdates);
          });
        })
        .catch((error) => {
          logger.error(
            `[getOrderBook] error subscribing to orderBookUpdates for market:${pairName} and depth:${depth}. Details: ${error}`
          );
        });
      return resp;
    } else {
      logger.debug(`[getOrderBook] returning cached key: ${cachedKey}`);
      return MarketDataUseCaseImpl.orderBookMap.get(cachedKey!)!;
    }
  }

  async subscribeOrderBookUpdates(
    req: InboundPort<OrderBookSnapshotRequest>
  ): Promise<Observable<SyncronizedOrderBook>> {
    const orderBookRequest = await req.adapt();
    if (!orderBookRequest.pairName || !orderBookRequest.depth) {
      throw new Error(
        '[subscribeOrderBookUpdates] pairName and depth are required'
      );
    }
    return this.exchange.subscribeOrderBookUpdates(orderBookRequest);
  }

  async getMarketLimitOperationCost(
    req: InboundPort<LimitOrderRequest>
  ): Promise<MarketOrderResponse> {
    const request = await req.adapt();
    const orderBook = await this.getOrderBook(
      OrderBookSnapshotAdapter.with({
        depth: EFFECTIVE_PRICE_MARKET_DEPTH,
        pairName: request.pairName,
      })
    );

    let filledQty = 0;
    let effectivePrice = 0;

    const bookSide = request.side === 'buy' ? 'asks' : 'bids';
    logger.info(
      `request side: ${request.side} limitPrice: ${request.limit} pairName: ${request.pairName}`
    );
    logger.info(
      `available qty price ${bookSide} ${orderBook[bookSide]?.reduce(
        (sum, bid) => sum + bid.price,
        0
      )}`
    );
    const book = orderBook[bookSide]!;
    // bids sorted desc and asks sorted asc
    for (const order of book) {
      const qtyToOperate =
        request.limit! - effectivePrice - order.price * order.amount >= 0
          ? order.amount
          : (request.limit! - effectivePrice) / order.price;
      filledQty += qtyToOperate;
      effectivePrice += order.price * qtyToOperate;

      logger.info(
        `order price: ${order.price} order amount: ${order.amount} qtyToOperate: ${qtyToOperate} filledQty: ${filledQty} effectivePrice: ${effectivePrice}`
      );
      if (effectivePrice >= request.limit!) {
        break;
      }
    }

    const marketOrderResponse: MarketOrderResponse = {
      filled_qty: filledQty,
      effective_price: effectivePrice,
      symbol: request.pairName,
    };

    return Promise.resolve(marketOrderResponse);
  }

  async getMarketOperationCost(
    req: InboundPort<MarketOrderRequest>
  ): Promise<MarketOrderResponse> {
    const request = await req.adapt();
    const orderBook = await this.getOrderBook(
      OrderBookSnapshotAdapter.with({
        depth: EFFECTIVE_PRICE_MARKET_DEPTH,
        pairName: request.pairName,
      })
    );

    let filledQty = 0;
    let effectivePrice = 0;

    const bookSide = request.side === 'buy' ? 'asks' : 'bids';
    logger.info(
      `request side: ${request.side} qty: ${request.amount} pairName: ${request.pairName}`
    );
    logger.info(
      `available qty in ${bookSide} ${orderBook[bookSide]?.reduce(
        (sum, bid) => sum + bid.amount,
        0
      )}`
    );
    const book = orderBook[bookSide]!;
    // bids sorted desc and asks sorted asc
    for (const order of book) {
      const qtyToOperate =
        order.amount - (request.amount! - filledQty) >= 0
          ? request.amount! - filledQty
          : order.amount;
      filledQty += qtyToOperate;
      effectivePrice += order.price * qtyToOperate;

      logger.info(
        `order price: ${order.price} order amount: ${order.amount} qtyToOperate: ${qtyToOperate} filledQty: ${filledQty} effectivePrice: ${effectivePrice}`
      );
      if (filledQty > request.amount!) {
        break;
      }
    }

    const marketOrderResponse: MarketOrderResponse = {
      filled_qty: filledQty,
      remaining_qty: request.amount! - filledQty,
      effective_price: effectivePrice,
      symbol: request.pairName,
    };

    return Promise.resolve(marketOrderResponse);
  }
}
