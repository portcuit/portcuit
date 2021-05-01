import {NextState, NextCsrState} from "./state";
import {EphemeralBoolean} from "@pkit/core";

export const shouldRender = <T extends NextState>({req: {render}}: T): boolean =>
  !!render?.valueOf();

export const shouldStateInit = <T extends NextState>({res: {init}}: T): boolean =>
  !!init?.valueOf();

export const hasNotReqExternalApi = <T extends NextCsrState>({req: {externalApi}}: T): boolean =>
  externalApi === undefined

export const shouldNotResExternalApi = <T extends NextCsrState>({res: {externalApi}}: T): boolean =>
  externalApi === undefined

export const shouldSsrMethodGet = <T extends NextState>({ssr: {method}}: T): boolean =>
  !!method && method.toUpperCase() === 'GET'

export const shouldSsrMethodPost = <T extends NextState>({ssr: {method}}: T): boolean =>
  !!method && method.toUpperCase() === 'POST'

export const shouldResHydrate = <T extends NextCsrState>({res: {hydrate}}: T): boolean =>
  !!hydrate?.valueOf()

// TODO: keyをEphemeralBooleanのみに限定する
export const hasReq = <T extends {req: any}, U extends keyof T['req']>(prop: U) =>
  (target: T): boolean =>
    !!target?.req?.[prop]?.valueOf()

export const hasRes = <T extends {res: any}, U extends keyof T['res']>(prop: U) =>
  (target: T): boolean =>
    !!target?.res?.[prop]?.valueOf()

export const hasNotReq = <T extends {req: any}, U extends keyof T['req']>(prop: U) =>
  (target: T): boolean =>
    !target?.req?.[prop]?.valueOf()

export const hasNotRes = <T extends {res: any}, U extends keyof T['res']>(prop: U) =>
  (target: T): boolean =>
    !target?.res?.[prop]?.valueOf()

export const isDoing = <T extends {doing: any}, U extends keyof T['doing']>(prop: U) =>
  (target: T): boolean =>
    target?.doing?.[prop] === true

export const isNotDoing = <T extends {doing: any}, U extends keyof T['doing']>(prop: U) =>
  (target: T): boolean =>
    target?.doing?.[prop] !== true

export const haveDone = <T extends {done: any}, U extends keyof T['done']>(prop: U) =>
  (target: T): boolean =>
    target?.done?.[prop] === true

export const haveNotDone = <T extends {done: any}, U extends keyof T['done']>(prop: U) =>
  (target: T): boolean =>
    target?.done?.[prop] !== true