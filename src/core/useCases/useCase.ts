export interface UseCase<I, O> {
  getOrderBookSnapshot(req: I): Promise<O>;
}
