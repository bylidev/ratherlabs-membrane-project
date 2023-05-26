import { SyncronizedOrderBook } from '../../../../core/domain/orderbookResponse';
import { Exchange } from '../../../../core/ports/outbound/exchange';
import { OrderBookSnapshotRequest } from '../../../../core/domain/orderBookRequest';
import { WebSocket } from 'ws';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import CRC from 'crc-32';
import _ from 'lodash';
import { logger } from '../../../../infrastructure/utils/logger';

export class Bitfinex implements Exchange {
  private GET_ORDER_BOOK_URL =
    'https://api-pub.bitfinex.com/v2/book/{pairName}/P0';
  private GET_ORDER_BOOK_WS = 'wss://api-pub.bitfinex.com/ws/2';
  static instance: Bitfinex;
  private constructor() {}

  static getInstance(): Bitfinex {
    if (!Bitfinex.instance) {
      Bitfinex.instance = new Bitfinex();
    }
    return Bitfinex.instance;
  }

  async getOrderBook(
    req: OrderBookSnapshotRequest
  ): Promise<SyncronizedOrderBook> {
    const params = new URLSearchParams();
    const ticker = req.pairName?.toString().replace('-', '').toUpperCase();

    params.append('len', req.depth!.toString());

    const url = new URL(
      this.GET_ORDER_BOOK_URL.replace('{pairName}', `t${ticker}`)
    );
    url.search = params.toString();
    return fetch(url)
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json[0] == 'error') {
          throw new Error(json[2]);
        }
        const resJson = json as number[][];
        return this.orderBookResponseToOrderBookUpdates(resJson);
      })
      .catch((err) => {
        logger.error(`Error getting order book from Bitfinex: ${err}`);
        throw err;
      });
  }

  private orderBookResponseToOrderBookUpdates(
    data: number[][]
  ): SyncronizedOrderBook {
    return data.reduce(
      (result, [precio, cantidad, tipo]) => {
        const entry = { amount: cantidad, count: 1, price: precio };

        if (tipo > 0) {
          result.bids = result.bids ? [...result.bids, entry] : [entry];
        } else {
          result.asks = result.asks ? [...result.asks, entry] : [entry];
        }

        return result;
      },
      {} as {
        bids?: { price: number; count: number; amount: number }[];
        asks?: { price: number; count: number; amount: number }[];
      }
    );
  }

  subscribeOrderBookUpdates(
    req: OrderBookSnapshotRequest
  ): Observable<SyncronizedOrderBook> {
    if (!req.depth || req.depth == 1) {
      throw new Error(
        'Depth 1 fails on Bitfinex websocket because possible bug.'
      );
    }
    // connect to websocket
    const ws = new WebSocket(this.GET_ORDER_BOOK_WS);
    const observer = new Subject<SyncronizedOrderBook>();
    const ticker = req.pairName?.toString().replace('-', '').toUpperCase();
    const BOOK: any = { bids: {}, asks: {}, psnap: {}, mcnt: 0 };

    ws.on('open', () => {
      // send websocket conf event with checksum flag
      ws.send(JSON.stringify({ event: 'conf', flags: 131072 }));
      // send subscribe to get desired book updates
      ws.send(
        JSON.stringify({
          event: 'subscribe',
          channel: 'book',
          pair: 't' + ticker,
          prec: 'P0',
          len: req.depth,
        })
      );
    });

    ws.on('message', (msg: any) => {
      msg = JSON.parse(msg);
      if (msg.event) return;
      if (msg[1] === 'hb') return;

      // if msg contains checksum, perform checksum
      if (msg[1] === 'cs') {
        const checksum = msg[2];
        const csdata = [];
        const bidsKeys = BOOK.psnap['bids'];
        const asksKeys = BOOK.psnap['asks'];

        // collect all bids and asks into an array
        for (let i = 0; i < 25; i++) {
          if (bidsKeys[i]) {
            const price = bidsKeys[i];
            const pp = BOOK.bids[price];
            csdata.push(pp.price, pp.amount);
          }
          if (asksKeys[i]) {
            const price = asksKeys[i];
            const pp = BOOK.asks[price];
            csdata.push(pp.price, -pp.amount);
          }
        }

        // create string of array to compare with checksum
        const csStr = csdata.join(':');
        const csCalc = CRC.str(csStr);
        if (csCalc !== checksum) {
          logger.fatal(
            `Bitfinex order book checksum failed for market ${req.pairName} with checksum: ${checksum} and calculated checksum: ${csCalc}`
          );
          process.exit(-1);
        } else {
          logger.debug('Checksum: ' + checksum + ' success!');
          observer.next(this.getOrderBookResponse(BOOK));
        }
        return;
      }

      // handle book. create book or update/delete price points
      if (BOOK.mcnt === 0) {
        _.each(msg[1], function (pp) {
          pp = { price: pp[0], count: pp[1], amount: pp[2] };
          const side = pp.amount >= 0 ? 'bids' : 'asks';
          pp.amount = Math.abs(pp.amount);
          BOOK[side][pp.price] = pp;
        });
      } else {
        msg = msg[1];
        const pp = { price: msg[0], count: msg[1], amount: msg[2] };

        // if count is zero, then delete price point
        if (!pp.count) {
          let found = true;

          if (pp.amount > 0) {
            if (BOOK['bids'][pp.price]) {
              delete BOOK['bids'][pp.price];
            } else {
              found = false;
            }
          } else if (pp.amount < 0) {
            if (BOOK['asks'][pp.price]) {
              delete BOOK['asks'][pp.price];
            } else {
              found = false;
            }
          }

          if (!found) {
            logger.fatal(
              `Bitfinex order book update failed for market ${
                req.pairName
              } with price point: ${JSON.stringify(pp)}`
            );
          }
        } else {
          // else update price point
          const side = pp.amount >= 0 ? 'bids' : 'asks';
          pp.amount = Math.abs(pp.amount);
          BOOK[side][pp.price] = pp;
        }

        // save price snapshots. Checksum relies on psnaps!
        _.each(['bids', 'asks'], function (side) {
          const sbook = BOOK[side];
          const bprices = Object.keys(sbook);
          const prices = bprices.sort(function (a, b) {
            if (side === 'bids') {
              return +a >= +b ? -1 : 1;
            } else {
              return +a <= +b ? -1 : 1;
            }
          });
          BOOK.psnap[side] = prices;
        });
      }
      BOOK.mcnt++;
    });

    return observer;
  }

  private getOrderBookResponse(req: any): SyncronizedOrderBook {
    return {
      bids: Object.values(req.bids),
      asks: Object.values(req.asks),
    };
  }
}
