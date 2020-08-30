import { Socket, LifecyclePort } from 'pkit/core';
import type { WorkerPort } from 'pkit/worker';
export declare const parentRemoteWorkerKit: (port: WorkerPort, socks: Socket<any>[], base?: LifecyclePort<any> | undefined) => import("rxjs").Observable<import("pkit/core").PortMessage<any> | import("pkit/core").PortMessage<Error>>;
