export interface InboundPort<T> {
  adapt(): Promise<T>;
}
