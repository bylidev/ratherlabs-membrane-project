import { MarketDataUseCaseImpl } from '../../../src/core/useCases/marketDataUseCaseImpl';
import { fail } from 'assert';
import { MockedExchange } from '../../../src/infrastructure/driven/exchanges/dummy/mockedExchange';
import { MarketOrderRequestAdapter } from '../../../src/infrastructure/drivers/http/adapters/marketOrderRequestAdapter';
import { OrderBookSnapshotAdapter } from '../../../src/infrastructure/drivers/http/adapters/orderBookSnapshotAdapter';
import { MarketLimitOrderRequestAdapter } from '../../../src/infrastructure/drivers/http/adapters/limitOrderRequestAdapter';
describe('GetOrderBookUseCase', () => {
  it('should return dummyExchange depth book for BTC-USD and subscribe to WSS.', async () => {
    //arrange
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { query: { pairName: 'BTC-USD', depth: 1 } };

    //act
    getOrderBookUseCase
      .getOrderBook(OrderBookSnapshotAdapter.with(req))
      .then((res) => {
        //assert bids sorted by price desc
        expect(res.bids!.length).toBe(2);
        expect(res.bids![0].amount).toBe(1.5);
        expect(res.bids![0].price).toBe(2.5);
        expect(res.bids![0].count).toBe(3.5);
        expect(res.bids![1].amount).toBe(1);
        expect(res.bids![1].price).toBe(2);
        expect(res.bids![1].count).toBe(3);
        // assert asks sorted by price asc
        expect(res.asks!.length).toBe(2);
        expect(res.asks![0].amount).toBe(4);
        expect(res.asks![0].price).toBe(5);
        expect(res.asks![0].count).toBe(6);
        expect(res.asks![1].amount).toBe(4.5);
        expect(res.asks![1].price).toBe(5.5);
        expect(res.asks![1].count).toBe(6.5);
        //expect( MarketDataUseCaseImpl.orderBookMap.get("BTC-USD")).toBeDefined()
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('should return dummyExchange depth book for ETH-USD and subscribe to WSS.', async () => {
    //arrange
    const req = { query: { pairName: 'ETH-USD', depth: 1 } };
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    //act
    getOrderBookUseCase
      .getOrderBook(OrderBookSnapshotAdapter.with(req))
      .then((res) => {
        //assert bids sorted by price desc
        expect(res.bids!.length).toBe(2);
        expect(res.bids![0].amount).toBe(1.5);
        expect(res.bids![0].price).toBe(2.5);
        expect(res.bids![0].count).toBe(3.5);
        expect(res.bids![1].amount).toBe(1);
        expect(res.bids![1].price).toBe(2);
        expect(res.bids![1].count).toBe(3);
        // assert asks sorted by price asc
        expect(res.asks!.length).toBe(2);
        expect(res.asks![0].amount).toBe(4);
        expect(res.asks![0].price).toBe(5);
        expect(res.asks![0].count).toBe(6);
        expect(res.asks![1].amount).toBe(4.5);
        expect(res.asks![1].price).toBe(5.5);
        expect(res.asks![1].count).toBe(6.5);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });

  it('On the second run it should return the book synchronized by wss.', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const req = { query: { pairName: 'BTC-USD', depth: 1 } };
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    //act
    getOrderBookUseCase
      .getOrderBook(OrderBookSnapshotAdapter.with(req))
      .then((res) => {
        //assert first pair 'HTTP' then subscribe to 'WSS'
        //assert bids sorted by price desc
        expect(res.bids!.length).toBe(2);
        expect(res.bids![0].amount).toBe(1.5);
        expect(res.bids![0].price).toBe(2.5);
        expect(res.bids![0].count).toBe(3.5);
        expect(res.bids![1].amount).toBe(1);
        expect(res.bids![1].price).toBe(2);
        expect(res.bids![1].count).toBe(3);
        // assert asks sorted by price asc
        expect(res.asks!.length).toBe(2);
        expect(res.asks![0].amount).toBe(4);
        expect(res.asks![0].price).toBe(5);
        expect(res.asks![0].count).toBe(6);
        expect(res.asks![1].amount).toBe(4.5);
        expect(res.asks![1].price).toBe(5.5);
        expect(res.asks![1].count).toBe(6.5);
        getOrderBookUseCase
          .getOrderBook(OrderBookSnapshotAdapter.with(req))
          .then((res) => {
            //assert 'UPDATED' with WSS
            expect(res.bids!.length).toBe(1);
            expect(res.bids![0].amount).toBe(7);
            expect(res.bids![0].price).toBe(8);
            expect(res.bids![0].count).toBe(9);

            expect(res.asks!.length).toBe(1);
            expect(res.asks![0].amount).toBe(10);
            expect(res.asks![0].price).toBe(11);
            expect(res.asks![0].count).toBe(12);
          });
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });

  it('should handle unexpected pair.', async () => {
    //arrange
    const req = { query: { pairName: 'DOGECOIN-XD', depth: 1 } };
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    //act
    getOrderBookUseCase
      .getOrderBook(OrderBookSnapshotAdapter.with(req))
      .then(() => {
        fail(`should not reach this point.`);
      })
      .catch((err: Error) => {
        //assert
        expect(err.message).toContain('pairName not supported');
      });
  });
});

describe('getMarketOperationCost buy', () => {
  it('getOperationCost with ask: [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 1 ', async () => {
    //arrange
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { pairName: 'BTC-USD', side: 'buy', amount: 1 };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //(asks 4,5,6)
        expect(res.remaining_qty).toBe(0);
        expect(res.effective_price).toBe(5);
        expect(res.filled_qty).toBe(1);
        expect(res.symbol).toBe('BTC-USD');
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask: [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 2', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 2 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //(asks 4,5,6)
        expect(res.remaining_qty).toBe(0);
        expect(res.effective_price).toBe(10);
        expect(res.filled_qty).toBe(2);
        expect(res.symbol).toBe('BTC-USD');
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask: [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 4', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 4 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //(asks 4,5,6)
        expect(res.remaining_qty).toBe(0);
        expect(res.effective_price).toBe(20);
        expect(res.filled_qty).toBe(4);
        expect(res.symbol).toBe('BTC-USD');
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask: [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 5', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 5 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        // 4*5+1*5.5
        expect(res.effective_price).toBe(25.5);
        expect(res.remaining_qty).toBe(0);
        expect(res.filled_qty).toBe(5);
        expect(res.symbol).toBe('BTC-USD');
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
});

describe('getMarketOperationCost sell', () => {
  it('getOperationCost with bids [{amount: 1.5, price: 2.5,count: 3.5},{amount: 1, price: 2,count: 3}] and sell qty 1 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'sell', amount: 1 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //sell at the best price
        expect(res.remaining_qty).toBe(0);
        expect(res.effective_price).toBe(2.5);
        expect(res.filled_qty).toBe(1);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with bids = [{amount: 1, price: 2,count: 3},{amount: 1.5, price: 2.5,count: 3.5}] and sell qty 2 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'sell', amount: 2 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        // should get the best price 2.5 * 1.5 = 3.75 + 0.5*2 = 1
        expect(res.remaining_qty).toBe(0);
        expect(res.effective_price).toBe(4.75);
        expect(res.filled_qty).toBe(2);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask: amount 4 price 5 and buy qty 2', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 2 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        // 2 * 5
        expect(res.remaining_qty).toBe(0);
        expect(res.filled_qty).toBe(2);
        expect(res.effective_price).toBe(10);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 4', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 4 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        // 4 * 5
        expect(res.remaining_qty).toBe(0);
        expect(res.filled_qty).toBe(4);
        expect(res.effective_price).toBe(20);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with ask [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5}] and buy qty 5', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 5 } };

    //act
    getOrderBookUseCase
      .getMarketOperationCost(MarketOrderRequestAdapter.with(req))
      .then((res) => {
        //assert best price buy 4 * 5 + 1 * 5.5
        expect(res.effective_price).toBe(25.5);
        expect(res.filled_qty).toBe(5);
        expect(res.remaining_qty).toBe(0);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
});

describe('getLimitOperationCost sell', () => {
  it('getOperationCost with asks = [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5} and buy limit price 1 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { pairName: 'BTC-USD', side: 'buy', limit: 1 };

    //act
    getOrderBookUseCase
      .getMarketLimitOperationCost(MarketLimitOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //  0.2 qty * 5 = 1
        expect(res.remaining_qty).toBe(undefined);
        expect(res.effective_price).toBe(1);
        expect(res.filled_qty).toBe(0.2);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with asks = [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5} and buy buy limit price 10 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { pairName: 'BTC-USD', side: 'buy', limit: 10 };

    //act
    getOrderBookUseCase
      .getMarketLimitOperationCost(MarketLimitOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //  2 qty * 5 = 10
        expect(res.remaining_qty).toBe(undefined);
        expect(res.effective_price).toBe(10);
        expect(res.filled_qty).toBe(2);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with asks = [{amount: 4, price: 5,count: 6},{amount: 4.5, price: 5.5,count: 6.5} and buy buy limit price 30 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { pairName: 'BTC-USD', side: 'buy', limit: 30 };

    //act
    getOrderBookUseCase
      .getMarketLimitOperationCost(MarketLimitOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //  4 qty * 5 = 20 && 1.82~ * 5.5
        expect(res.remaining_qty).toBe(undefined);
        expect(res.effective_price).toBe(30);
        expect(res.filled_qty).toBe(5.818181818181818);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
  it('getOperationCost with bids = [{amount: 1.5, price: 2.5,count: 3.5},{amount: 1, price: 2,count: 3}] and sell limit price 30 ', async () => {
    //arrange
    MarketDataUseCaseImpl.orderBookMap.clear();
    const getOrderBookUseCase = MarketDataUseCaseImpl.with(
      MockedExchange.getInstance()
    );
    const req = { pairName: 'BTC-USD', side: 'sell', limit: 30 };

    //act
    getOrderBookUseCase
      .getMarketLimitOperationCost(MarketLimitOrderRequestAdapter.with(req))
      .then((res) => {
        //assert
        //  1.5 qty * 2.5 = 3.75 && 1 qty * 2 = 2 total 5.75
        expect(res.remaining_qty).toBe(undefined);
        expect(res.effective_price).toBe(5.75); // the market is out of liquidity !
        expect(res.filled_qty).toBe(2.5);
      })
      .catch((err) => {
        fail(`should not reach this point. Cause ${err}`);
      });
  });
});
