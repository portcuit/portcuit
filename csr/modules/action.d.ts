import type { Module } from 'snabbdom/modules/module';
import type { DeepPartial } from "pkit";
declare type ClonedEvent<T = any> = {
    clientX: number;
    clientY: number;
    key: string;
    code: string;
    detail: T;
    currentTarget: {
        value: string;
        checked: boolean;
        dataset: {
            [key: string]: string | undefined;
        };
    };
};
export declare type ActionHandler<T, U = any> = (ev: ActionEvent) => undefined | ((data: ClonedEvent<U>) => undefined | DeepPartial<T>);
export declare type Action<T, U = any> = {
    [P in keyof HTMLElementEventMap]?: ActionHandler<T, U>;
};
export declare type ClonedAction = {
    [P in keyof HTMLElementEventMap]?: string;
};
export declare type ActionDetail = [fn: string, data: ClonedEvent];
declare type ActionEvent = UIEvent & InputEvent & MouseEvent & KeyboardEvent & {
    currentTarget: HTMLElement & HTMLInputElement;
};
export declare const createActionModule: (target: EventTarget) => Module;
export {};
