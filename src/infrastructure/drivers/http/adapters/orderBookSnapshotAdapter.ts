import { OrderBookSnapshotRequest } from '../../../../core/domain/orderBookRequest';
import { InboundPort } from '../../../../core/ports/inbound/inbound';

export class OrderBookSnapshotAdapter
  implements InboundPort<OrderBookSnapshotRequest>
{
  private req: any;

  private constructor(req: Express.Request) {
    this.req = req;
  }

  static with(req: any): OrderBookSnapshotAdapter {
    if (req.query) {
      return new this(req.query);
    } else {
      return new this(req);
    }
  }

  adapt(): Promise<OrderBookSnapshotRequest> {
    return new Promise((resolve, reject) => {
      if (!this.req.pairName || !this.req.depth) {
        reject(new Error("Params: 'pairName' and 'depth' are required"));
      }
      resolve({ pairName: this.req.pairName, depth: this.req.depth });
    });
  }
}
