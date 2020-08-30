import { Observable } from 'rxjs';
import { Sink } from 'pkit/core';
import type { Compute } from './';
export declare class PreserveArray<T> extends Array {
    constructor(...props: T[]);
}
export declare class ReplaceArray<T> extends Array {
    constructor(...props: T[]);
}
export declare class ReplaceObject<T> {
    constructor(data: T);
}
export declare class EphemeralBoolean extends Boolean {
    constructor(data: boolean);
    toJSON(): undefined;
}
export declare const patch: (plan: any, data: any) => any;
export declare const initProc: <T, U>(init$: Observable<U>, patch$: Observable<U>, rawSink: Sink<U>, dataSink: Sink<T>, compute: Compute<T>) => Observable<import("pkit/core").PortMessage<U> | import("pkit/core").PortMessage<T>>;
export declare const splice: <T>(start: number, deleteCount?: number, items?: T[]) => T[];
export declare const padArray: <T>(start: number, item: T, end?: number) => T[];
