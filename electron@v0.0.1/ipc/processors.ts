import {Observable} from "rxjs";
import {Sink} from "pkit/core/index";

export type SourceSink = [Observable<any>, Sink<any>]
