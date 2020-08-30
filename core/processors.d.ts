import { Observable, Subject } from 'rxjs';
import type { LifecyclePort } from './';
export declare class Socket<T> {
    source$: Observable<T>;
    sink: Sink<T>;
    path: any[];
}
export declare type PortData = any;
export declare type PortMessage<T extends PortData> = [string, T];
export declare type PortSink<T> = {
    [P in keyof T]?: T[P] extends Socket<infer I> ? I : PortSink<T[P]>;
};
export declare type Sink<T> = (value?: T) => PortMessage<T>;
export declare type SourceSink = [Observable<any>, Sink<any>];
export declare type UnwrapSocket<T> = T extends Socket<infer I> ? I : never;
export declare const source: <T>(sock: Socket<T>) => Observable<T>;
export declare const sink: <T>(sock: Socket<T>) => Sink<T>;
export declare const portPath: (port: Socket<any> | LifecyclePort) => any[];
export declare type RootCircuit<T> = (port: T) => Observable<PortMessage<any>>;
export declare const entry: <T, U extends LifecyclePort<T>>(port: U, circuit: RootCircuit<U>, params?: T | undefined) => Subject<PortMessage<any>>;
export declare const terminatedComplete: <T extends PortMessage<any>>(subject$: Subject<T>) => Observable<T>;
export declare const mount: <T, U extends LifecyclePort<T>, V extends new () => U>([Port, circuit, params]: [Port: V, circuit: RootCircuit<U>, params: T]) => Subject<PortMessage<any>>;
export declare namespace Pkit {
    class Error extends globalThis.Error {
        constructor(message: string);
    }
    class EventError extends Error {
        error: Event;
        constructor(error: Event);
    }
}
export declare type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ? Array<DeepPartial<U>> : T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>> : DeepPartial<T[P]>;
};
export declare type Ns<T extends {}> = T;
export declare type NsPath = string[];
export declare const ns2path: <T>(ns: DeepPartial<T>) => string[][];
export declare type MappedWrapObservable<T> = {
    [P in keyof T]: Observable<T[P]>;
};
export declare type MappedWrapSocket<T> = {
    [P in keyof T]: Socket<T[P]>;
};
export declare const throwErrorIfUndefined: <T>(data: T) => T;
