import { fail } from 'assert';
import { MarketOrderRequestAdapter } from '../../../../../src/infrastructure/drivers/http/adapters/marketOrderRequestAdapter';
describe('MarketOrderRequestAdapter: validate express adapter', () => {
  it('should pass buy request body', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', side: 'buy', amount: 1 } };

    //act
    MarketOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        //assert
        expect(res.pairName).toBe('BTC-USD');
        expect(res.amount).toBe(1);
        expect(res.side).toBe('buy');
      })
      .catch((err) => {
        fail(err);
      });
  });
  it('should pass sell request body', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', side: 'sell', amount: 1 } };

    //act
    MarketOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        //assert
        expect(res.pairName).toBe('BTC-USD');
        expect(res.amount).toBe(1);
        expect(res.side).toBe('sell');
      })
      .catch((err) => {
        fail(err);
      });
  });
  it('should validate side 1', async () => {
    //arrange
    const req = { body: { pairName: 'BTC-USD', side: 'a', amount: 1 } };

    //act
    MarketOrderRequestAdapter.with(req)
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
    const req = { body: { pairName: 'BTC-USD', side: undefined, amount: 1 } };

    //act
    MarketOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'pairName', 'side' and 'amount' are required"
        );
      });
  });
  it('should validate amount ', async () => {
    //arrange
    const req = {
      body: { pairName: 'BTC-USD', side: 'buy', amount: undefined },
    };

    //act
    MarketOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'pairName', 'side' and 'amount' are required"
        );
      });
  });
  it('should validate pairName ', async () => {
    //arrange
    const req = {
      body: { pairName: undefined, side: 'buy', amount: undefined },
    };

    //act
    MarketOrderRequestAdapter.with(req)
      .adapt()
      .then((res) => {
        fail('should not pass');
      })
      .catch((err) => {
        //assert
        expect(err.message).toBe(
          "Params: 'pairName', 'side' and 'amount' are required"
        );
      });
  });
});
