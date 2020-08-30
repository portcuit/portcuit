/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { Observable } from 'rxjs';
import { Sink } from 'pkit/core';
export declare type RequestArgs = [IncomingMessage, ServerResponse];
export declare const reserveResponse: (id?: string) => ([, res]: RequestArgs) => void;
export declare const isNotReserved: ([, res]: RequestArgs) => boolean;
export declare const isMatchEndpoint: (pattern: string, targetMethod?: string | undefined) => ([{ url, headers: { origin }, method }]: RequestArgs) => boolean;
export declare const get: (pattern: string, source$: Observable<RequestArgs>) => Observable<RequestArgs>;
export declare const route: (pattern: string, source$: Observable<RequestArgs>, method?: string | undefined) => Observable<RequestArgs>;
export declare type RouteReq = [{
    method?: string;
    url: URL;
}, RequestArgs];
export declare const routeProc: (source$: Observable<RequestArgs>, sink: Sink<RequestArgs>, fn: (data: RouteReq) => boolean) => Observable<import("pkit/core").PortMessage<RequestArgs>>;
export declare const preflightProc: (source$: Observable<RequestArgs>, sink: Sink<any>) => Observable<import("pkit/core").PortMessage<any>>;
export declare const notFoundProc: (source$: Observable<RequestArgs>, sink: Sink<any>) => Observable<import("pkit/core").PortMessage<any>>;
export declare const remoteReceiveProc: (source$: Observable<RequestArgs>, sink: Sink<void>, errSink: Sink<Error>) => Observable<any>;
export declare const promiseJsonProc: <T, U>(source$: Observable<RequestArgs>, sink: Sink<void>, fn: (data: T) => Promise<U>) => Observable<import("pkit/core").PortMessage<void>>;
