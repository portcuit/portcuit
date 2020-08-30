/// <reference types="node" />
import type { IncomingMessage } from "http";
import { LifecyclePort, Socket } from 'pkit/core';
import { RequestArgs } from "../processors";
export declare type SseServerParams = {
    args: RequestArgs;
    retry: number;
};
export declare class SseServerPort extends LifecyclePort<SseServerParams> {
    id: Socket<string>;
    client: Socket<IncomingMessage>;
    event: {
        close: Socket<void>;
    };
}
export declare const sseServerKit: (port: SseServerPort) => import("rxjs").Observable<import("pkit/core").PortMessage<any> | import("pkit/core").PortMessage<Error> | import("pkit/core").PortMessage<string> | import("pkit/core").PortMessage<IncomingMessage> | import("pkit/core").PortMessage<void>>;
export declare const sseServerRemoteKit: (port: SseServerPort, socks: Socket<any>[]) => import("rxjs").Observable<import("pkit/core").PortMessage<any>>;
