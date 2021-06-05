import 'setimmediate'
import {merge, of, Subject} from "rxjs";
import {groupBy, tap} from "rxjs/operators";
import {
  PortMessage,
  sink,
  Socket,
  PrivateSinkSocket,
  source,
  SocketData,
  DeepPartialPort,
  cycleFlow,
} from "../core/";
import {mapToProc} from '../processors/'
import {inject} from "./processors";

export abstract class Port {
  init = new Socket<any>();
  ready = new Socket<any>();
  info = new Socket<any>();
  debug = new Socket<any>();
  err = new Socket<Error>();

  start = new Socket<any>();
  starting = new PrivateSinkSocket<boolean>();
  started = new PrivateSinkSocket<any>();
  stop = new Socket<any>();
  stopping = new PrivateSinkSocket<boolean>();
  stopped = new PrivateSinkSocket<any>();
  restart = new Socket<any>();
  restarting = new PrivateSinkSocket<boolean>();
  restarted = new PrivateSinkSocket<any>();
  running = new PrivateSinkSocket<boolean>();
  terminate = new Socket<any>();
  terminating = new PrivateSinkSocket<boolean>();
  terminated = new Socket<any>();

  constructor (port: DeepPartialPort<Port> = {}) {
    setImmediate(() =>
      Object.assign(this, port))
    Object.assign(this, port)
  }

  next (type: string, data: any): void { }

  namespace () {
    return ''
  }

  log (msg: PortMessage<any>) {
    console.log(...msg);
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
        this.log(msg)),
      tap(([type]) =>
        type === `${namespace}terminated` &&
        setImmediate(() =>
          subject$.complete())));
  }

  flow () {
    return mapToProc(of(true), sink(this.debug))
  }
}
