/// <reference types="src/vendor/pkit/types" />
import type { VNode } from 'snabbdom/vnode';
import { Socket, LifecyclePort, StatePort } from 'pkit';
import { ActionDetail } from "./";
export * from './modules/action';
export * from './processors';
export declare const defaultModules: Partial<{
    pre: import("snabbdom/build/package/hooks").PreHook;
    create: import("snabbdom/build/package/hooks").CreateHook;
    update: import("snabbdom/build/package/hooks").UpdateHook;
    destroy: import("snabbdom/build/package/hooks").DestroyHook;
    remove: import("snabbdom/build/package/hooks").RemoveHook;
    post: import("snabbdom/build/package/hooks").PostHook;
}>[];
export declare type SnabbdomParams = {
    container: Element;
    target: EventTarget;
    options?: {
        window: Window;
        hashchange?: boolean;
    };
};
export declare class SnabbdomPort extends LifecyclePort<SnabbdomParams> {
    render: Socket<VNode>;
    vnode: Socket<VNode>;
    action: Socket<ActionDetail>;
    event: {
        hashchange: Socket<string>;
    };
}
export declare const snabbdomKit: (port: SnabbdomPort) => import("rxjs").Observable<import("pkit").PortMessage<any> | import("pkit").PortMessage<Error> | import("pkit").PortMessage<string> | import("pkit").PortMessage<VNode> | import("pkit").PortMessage<ActionDetail>>;
export declare const snabbdomActionPatchKit: <T>(port: SnabbdomPort, state: StatePort<T>) => import("rxjs").Observable<import("pkit").PortMessage<import("pkit").DeepPartial<T>>>;
