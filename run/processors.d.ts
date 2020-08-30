import { Observable } from "rxjs";
import { Sink } from "pkit/core";
export declare const restartProc: (source$: Observable<any>, running$: Observable<boolean>, stopped$: Observable<unknown>, started$: Observable<unknown>, runningSink: Sink<boolean>, restartedSink: Sink<any>) => Observable<import("pkit/core").PortMessage<boolean> | import("pkit/core").PortMessage<any>>;
