import { Observable } from 'rxjs';
import { OrderBookSnapshotRequest } from '../../../../core/domain/orderBookRequest';
import { SyncronizedOrderBook } from '../../../../core/domain/orderbookResponse';
import { Exchange } from '../../../../core/ports/outbound/exchange';

export class MockedExchange implements Exchange {
  static instance: MockedExchange;

  private constructor() {}

  static getInstance(): MockedExchange {
    if (!MockedExchange.instance) {
      MockedExchange.instance = new MockedExchange();
    }
    return MockedExchange.instance;
  }

  async getOrderBook(
    req: OrderBookSnapshotRequest
  ): Promise<SyncronizedOrderBook> {
    if (req.pairName === 'BTC-USD' || req.pairName === 'ETH-USD') {
      const dummyBook = new SyncronizedOrderBook();
      dummyBook.bids = [
        { amount: 1.5, price: 2.5, count: 3.5 },
        { amount: 1, price: 2, count: 3 },
      ];
      dummyBook.asks = [
        { amount: 4, price: 5, count: 6 },
        { amount: 4.5, price: 5.5, count: 6.5 },
      ];
      return dummyBook;
    } else {
      throw new Error('pairName not supported');
    }
  }

  subscribeOrderBookUpdates(
    req: OrderBookSnapshotRequest
  ): Observable<SyncronizedOrderBook> {
    return new Observable<SyncronizedOrderBook>((subscriber) => {
      if (req.pairName === 'BTC-USD' || req.pairName === 'ETH-USD') {
        const dummyBook = new SyncronizedOrderBook();
        dummyBook.bids = [{ amount: 7, price: 8, count: 9 }];
        dummyBook.asks = [{ amount: 10, price: 11, count: 12 }];
        subscriber.next(dummyBook);
      } else {
        subscriber.error('pairName not supported');
      }
    });
  }
}
