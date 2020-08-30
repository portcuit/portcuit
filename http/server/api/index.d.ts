/// <reference types="node" />
import { OutgoingHttpHeaders } from "http";
import type { VNode } from 'snabbdom/vnode';
import 'snabbdom-to-html';
import { LifecyclePort, Socket } from "pkit/core";
import { RequestArgs } from "pkit/http/server/processors";
declare type ApiResponse = readonly [status: number, headers: OutgoingHttpHeaders, body: any];
declare class ContentTypePort {
    json: Socket<any>;
    html: Socket<string>;
    vnode: Socket<VNode>;
}
export declare class HttpServerApiPort extends LifecyclePort<RequestArgs> implements ContentTypePort {
    json: Socket<any>;
    html: Socket<string>;
    vnode: Socket<VNode>;
    notFound: ContentTypePort;
    terminate: Socket<ApiResponse>;
}
export declare const httpServerApiKit: (port: HttpServerApiPort) => import("rxjs").Observable<import("pkit/core").PortMessage<any> | import("pkit/core").PortMessage<Error>>;
export declare const httpServerApiTerminateKit: (port: HttpServerApiPort) => import("rxjs").Observable<import("pkit/core").PortMessage<any>>;
export {};
