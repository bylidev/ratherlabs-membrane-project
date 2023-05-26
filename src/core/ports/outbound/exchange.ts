import { Observable } from 'rxjs';
import { OrderBookSnapshotRequest } from '../../domain/orderBookRequest';
import { SyncronizedOrderBook } from '../../domain/orderbookResponse';

export interface Exchange {
  getOrderBook(req: OrderBookSnapshotRequest): Promise<SyncronizedOrderBook>;
  subscribeOrderBookUpdates(
    req: OrderBookSnapshotRequest
  ): Observable<SyncronizedOrderBook>;
}
