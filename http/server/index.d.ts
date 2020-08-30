/// <reference types="node" />
import http from 'http';
import { Socket, EndpointPort, LifecyclePort } from 'pkit/core';
import { RunPort } from 'pkit/run';
import { RequestArgs } from './processors';
export * from './processors';
export * from './sse/';
export * from './api/';
export declare type HttpServerParams = {
    server?: http.ServerOptions;
    listen?: [port?: number, host?: string];
};
export declare class HttpServerPort extends LifecyclePort<HttpServerParams> {
    run: RunPort;
    server: Socket<http.Server>;
    event: {
        request: Socket<RequestArgs>;
    };
}
export declare const httpServerKit: (port: HttpServerPort) => import("rxjs").Observable<import("pkit/core").PortMessage<boolean> | import("pkit/core").PortMessage<any> | import("pkit/core").PortMessage<http.Server> | import("pkit/core").PortMessage<Error> | import("pkit/core").PortMessage<RequestArgs>>;
export declare const httpServerRemoteKit: (port: EndpointPort<RequestArgs, void>) => import("rxjs").Observable<any>;
export declare const notFoundKit: (port: HttpServerPort) => import("rxjs").Observable<import("pkit/core").PortMessage<any>>;
