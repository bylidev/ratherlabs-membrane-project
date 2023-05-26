import { Observable } from 'rxjs';
import { OrderBookSnapshotRequest as OrderBookSnapshotRequest } from '../domain/orderBookRequest';
import { SyncronizedOrderBook } from '../domain/orderbookResponse';
import { InboundPort } from '../ports/inbound/inbound';
import { MarketOrderRequest } from '../domain/marketOrderRequest';
import { MarketOrderResponse } from '../domain/marketOrderResponse';
import { LimitOrderRequest } from '../domain/limitOrderRequest';

export interface MarketDataUseCases {
  getOrderBook(
    req: InboundPort<OrderBookSnapshotRequest>
  ): Promise<SyncronizedOrderBook>;
  subscribeOrderBookUpdates(
    req: InboundPort<OrderBookSnapshotRequest>
  ): Promise<Observable<SyncronizedOrderBook>>;
  getMarketOperationCost(
    req: InboundPort<MarketOrderRequest>
  ): Promise<MarketOrderResponse>;
  getMarketLimitOperationCost(
    req: InboundPort<LimitOrderRequest>
  ): Promise<MarketOrderResponse>;
}
