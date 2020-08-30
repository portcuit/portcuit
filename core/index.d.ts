import { Socket } from './processors';
export * from './processors';
export declare class LifecyclePort<T = any> {
    init: Socket<T>;
    ready: Socket<any>;
    terminate: Socket<any>;
    terminated: Socket<any>;
    quit: Socket<any>;
    info: Socket<any>;
    debug: Socket<any>;
    running: Socket<boolean>;
    err: Socket<Error>;
    _ns?: string[];
}
export declare class DataPort<T> {
    data: Socket<T>;
}
export declare type MappedWrapDataPort<T> = {
    [P in keyof T]: DataPort<T[P]>;
};
export declare class EndpointPort<T, U, V = Error> {
    req: Socket<T>;
    res: Socket<U>;
    err: Socket<V>;
}
