import { Socket, DeepPartial } from 'pkit/core';
export * from './processors';
export declare class StatePort<T> {
    raw: Socket<DeepPartial<T>>;
    init: Socket<DeepPartial<T>>;
    patch: Socket<DeepPartial<T>>;
    data: Socket<T>;
}
export declare type Compute<T> = (state: DeepPartial<T>) => T;
export declare const stateKit: <T>(port: StatePort<T>, compute?: Compute<T>) => import("rxjs").Observable<import("pkit/core").PortMessage<DeepPartial<T>> | import("pkit/core").PortMessage<T>>;
