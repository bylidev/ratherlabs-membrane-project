import { fail } from 'assert';
import { MarketLimitOrderRequestAdapter } from '../../../../../src/infrastructure/drivers/http/adapters/limitOrderRequestAdapter';
describe('limitOrder: validate express adapter', () => {
  it('should pass buy request body', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', limit: 1, side: 'buy' } };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        //assert
        expect(res.pairName).toBe('BTC-USD');
        expect(res.limit).toBe(1);
        expect(res.side).toBe('buy');
      })
      .catch((err) => {
        fail(err);
      });
  });
  it('should pass sell request body', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', limit: 1, side: 'sell' } };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        //assert
        expect(res.pairName).toBe('BTC-USD');
        expect(res.limit).toBe(1);
        expect(res.side).toBe('sell');
      })
      .catch((err) => {
        fail(err);
      });
  });
  it('should validate side 1', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', limit: 1, side: 'a' } };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe("Param: 'side' must be 'buy' or 'sell'");
      });
  });
  it('should validate side 2', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', limit: 1, side: undefined } };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'limit','side','pairName' are required"
        );
      });
  });
  it('should validate limit ', async () => {
    //arrange
    const req = {
      body: { pairName: 'BTC-USD', limit: undefined, side: 'buy' },
    };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'limit','side','pairName' are required"
        );
      });
  });
  it('should validate pairName ', async () => {
    //arrange
    const req = { body: { pairName: undefined, limit: 1, side: 'buy' } };

    //act
    MarketLimitOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'limit','side','pairName' are required"
        );
      });
  });
});
