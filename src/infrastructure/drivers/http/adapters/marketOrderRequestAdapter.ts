import { MarketOrderRequest } from '../../../../core/domain/marketOrderRequest';
import { InboundPort } from '../../../../core/ports/inbound/inbound';

export class MarketOrderRequestAdapter
  implements InboundPort<MarketOrderRequest>
{
  private req: any;

  private constructor(req: Express.Request) {
    this.req = req;
  }

  static with(req: any): MarketOrderRequestAdapter {
    if (req.body) {
      return new this(req.body);
    } else {
      return new this(req);
    }
  }

  adapt(): Promise<MarketOrderRequest> {
    return new Promise((resolve, reject) => {
      const request: MarketOrderRequest = this.req;
      if (!request || !request.pairName || !request.side || !request.amount) {
        reject(
          new Error("Params: 'pairName', 'side' and 'amount' are required")
        );
      }
      if (request.side != 'buy' && request.side != 'sell') {
        reject(new Error("Param: 'side' must be 'buy' or 'sell'"));
      }
      resolve(request);
    });
  }
}
