import { Socket } from 'pkit/core';
export declare const childRemoteWorkerKit: (info: Socket<any>, err: Socket<Error>, parentPort: MessagePort, socks: Socket<any>[]) => import("rxjs").Observable<import("pkit/core").PortMessage<any> | import("pkit/core").PortMessage<Error>>;
