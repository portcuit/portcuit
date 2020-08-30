/// <reference types="src/vendor/pkit/types" />
import { Observable } from "rxjs";
import { DeepPartial, Sink } from "pkit";
import { Action, ActionDetail } from "./modules/action";
export declare const actionProc: <T>(source$: Observable<ActionDetail>, sink: Sink<DeepPartial<T>>) => Observable<import("pkit").PortMessage<DeepPartial<T>>>;
export declare const action: <T, U = undefined>(action: Action<T, U>, detail?: U | undefined) => ({} | undefined)[];
