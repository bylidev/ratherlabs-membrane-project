export class SyncronizedOrderBook {
  bids?: { amount: number; count: number; price: number }[];
  asks?: { amount: number; count: number; price: number }[];
}
