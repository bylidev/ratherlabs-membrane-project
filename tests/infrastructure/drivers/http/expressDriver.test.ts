import request from 'supertest';
import { ExpressDriver } from '../../../../src/infrastructure/drivers/http/expressDriver';
import { MockedExchange } from '../../../../src/infrastructure/driven/exchanges/dummy/mockedExchange';

const expressDriver = ExpressDriver.with({
  port: 3005,
  exchange: MockedExchange.getInstance(),
});
const express = expressDriver.execute();

describe('Get OrderBook.', () => {
  it('should require pairName', async () => {
    const response = await request(express)
      .get('/')
      .query({ pairName: undefined, depth: 1 });
    expect(response.status).toBe(400);
    expect(response.text).toBe("Params: 'pairName' and 'depth' are required");
  });
  it('should return BTC-USD response', async () => {
    const response = await request(express)
      .get('/')
      .query({ pairName: 'BTC-USD', depth: 1 });
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      '{"bids":[{"amount":1.5,"price":2.5,"count":3.5},{"amount":1,"price":2,"count":3}],"asks":[{"amount":4,"price":5,"count":6},{"amount":4.5,"price":5.5,"count":6.5}]}'
    );
  });

  it('should return ETH-USD response', async () => {
    const response = await request(express)
      .get('/')
      .query({ pairName: 'ETH-USD', depth: 1 });
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      '{"bids":[{"amount":1.5,"price":2.5,"count":3.5},{"amount":1,"price":2,"count":3}],"asks":[{"amount":4,"price":5,"count":6},{"amount":4.5,"price":5.5,"count":6.5}]}'
    );
  });

  it('should handle unexpected pairNames.', async () => {
    const response = await request(express)
      .get('/')
      .query({ pairName: 'DOGECOIN-XD', depth: 1 });
    expect(response.status).toBe(400);
  });
});

afterAll((done) => {
  expressDriver.close();
  done();
});
