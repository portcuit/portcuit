import { Socket } from "pkit/core";
export declare class RunPort {
    start: Socket<boolean>;
    started: Socket<any>;
    stop: Socket<boolean>;
    stopped: Socket<any>;
    restart: Socket<any>;
    restarted: Socket<any>;
}
export declare const runKit: (port: RunPort, running: Socket<boolean>) => import("rxjs").Observable<import("pkit/core").PortMessage<boolean> | import("pkit/core").PortMessage<any>>;
