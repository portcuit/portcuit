import type { SseServerParams } from "./";
import { Observable } from "rxjs";
import { Sink, SourceSink } from "pkit/core";
export declare const connectProc: (source$: Observable<SseServerParams>, sink: Sink<string>) => Observable<import("pkit/core").PortMessage<string>>;
export declare const sendProc: (params$: Observable<SseServerParams>, close$: Observable<void>, sink: Sink<any>, sourceSinks: SourceSink[]) => Observable<import("pkit/core").PortMessage<any>>;
