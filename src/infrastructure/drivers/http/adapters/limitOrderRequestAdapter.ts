import { LimitOrderRequest } from '../../../../core/domain/limitOrderRequest';
import { InboundPort } from '../../../../core/ports/inbound/inbound';

export class MarketLimitOrderRequestAdapter
  implements InboundPort<LimitOrderRequest>
{
  private req: any;

  private constructor(req: Express.Request) {
    this.req = req;
  }

  static with(req: any): MarketLimitOrderRequestAdapter {
    if (req.body) {
      return new this(req.body);
    } else {
      return new this(req);
    }
  }

  adapt(): Promise<LimitOrderRequest> {
    return new Promise((resolve, reject) => {
      const request: LimitOrderRequest = this.req;
      if (!request || !request.limit || !request.side || !request.pairName) {
        reject(new Error("Params: 'limit','side','pairName' are required"));
      }
      if (request.side != 'buy' && request.side != 'sell') {
        reject(new Error("Param: 'side' must be 'buy' or 'sell'"));
      }
      resolve(request);
    });
  }
}
