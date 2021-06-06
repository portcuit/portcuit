import 'setimmediate'
import {merge, of, Subject} from "rxjs";
import {groupBy, tap} from "rxjs/operators";
import {
  PortMessage,
  Socket,
  SocketData,
  DeepPartialPort,
  cycleFlow,
} from "../core/";
import {inject} from "./lib";

export abstract class Port {
  init = new Socket<any>();
  ready = new Socket<any>();
  info = new Socket<any>();
  debug = new Socket<any>();
  err = new Socket<Error>();
  terminate = new Socket<any>();
  complete = new Socket<any>();

  constructor (port: DeepPartialPort<Port> & {[key: string]: any} = {}) {
    setImmediate(() =>
      Object.assign(this, port))
    Object.assign(this, port)
  }

  next (type: string, data: any): void { }

  namespace () {
    return ''
  }

  log (...args: PortMessage<any>) {
    console.log(...args);
  }

  injectedHook (data: boolean) { }
  initHook (data: boolean) { }

  run (params: SocketData<this['init']>) {
    const subject$ = new Subject<PortMessage<any>>();

    this.next = (type, data) =>
      subject$.next([type, data]);

    const group$ = subject$.asObservable().pipe(
      groupBy(([type]) => type));

    const namespace = this.namespace();
    inject(this, group$, subject$, namespace);

    this.injectedHook(true)

    return merge(
      this.flow(),
      of([`${namespace}init`, params] as PortMessage<any>).pipe(
        tap(() => {
          this.initHook(true);
          setImmediate(() =>
            subject$.next(['init', params]));
        }))
    ).pipe(
      tap((msg) =>
        this.log(...msg)),
      tap(([type]) =>
        type === `${namespace}complete` &&
        setImmediate(() =>
          subject$.complete())));
  }

  flow () {
    const flows = {}
    for (const name in this) {
      if (name.endsWith('Flow')) {
        Object.assign(flows, {[name]: this[name]})
      }
    }

    return cycleFlow(this, 'init', 'complete', flows)
  }
}
