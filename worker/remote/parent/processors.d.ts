import { Observable } from 'rxjs';
import { Sink, SourceSink, PortMessage } from 'pkit/core';
export declare const receiveProc: (worker$: Observable<Worker>, prefixPath?: string[]) => Observable<PortMessage<any>>;
export declare const sendProc: (worker$: Observable<Worker>, msg$: Observable<PortMessage<any>>, infoSink: Sink<any>, errSink: Sink<Error>, sourceSinks: SourceSink[], prefixPath?: string[]) => Observable<PortMessage<any> | PortMessage<Error>>;
