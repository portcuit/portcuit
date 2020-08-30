import { Socket, LifecyclePort, PortMessage } from 'pkit/core';
import { RunPort } from 'pkit/run';
export * from './remote/';
export declare type WorkerParams = {
    ctor: typeof Worker;
    args: ConstructorParameters<typeof Worker>;
};
export declare class WorkerPort extends LifecyclePort<WorkerParams> {
    run: RunPort;
    worker: Socket<Worker>;
    err: Socket<Error>;
    msg: Socket<PortMessage<any>>;
}
export declare const workerKit: (port: WorkerPort) => import("rxjs").Observable<PortMessage<boolean> | PortMessage<any> | PortMessage<Error> | PortMessage<Worker>>;
