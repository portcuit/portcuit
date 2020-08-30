import { Observable } from 'rxjs';
import { Sink, PortMessage, SourceSink } from 'pkit/core';
export declare const receiveProc: (parentPort: MessagePort) => Observable<PortMessage<any>>;
export declare const sendProc: (debugSink: Sink<any>, errSink: Sink<Error>, parentPort: MessagePort, sourceSinks: SourceSink[]) => Observable<PortMessage<any> | PortMessage<Error>>;
