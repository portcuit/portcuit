import 'setimmediate'
import {merge, Observable, of, Subject} from "rxjs";
import {catchError, groupBy, tap} from "rxjs/operators";
import {
  PortMessage,
  sink,
  Socket,
  PrivateSinkSocket,
  source,
  SocketData,
  DeepPartialPort,
  PortLogFilters,
} from "../core/";
import {mapToProc} from '../processors/'
import {restartProc, inject} from "./processors";

export abstract class LifecyclePort {
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

  constructor(port: DeepPartialPort<LifecyclePort> = {}) {
    Object.assign(this, port);
  }

  next (type: string, data: any): void {}

  namespace () {
    return ''
  }

  includes (): PortLogFilters {
    return [() => true]
  }

  excludes (): PortLogFilters {
    return []
  }

  log (msg: PortMessage<any>) {
    if (this.excludes().find((exclude) => exclude(msg))) { return; }
    if (!this.includes().find((include) => include(msg))) { return; }
    console.log(...msg);
  }

  injectedHook (data: boolean) {}
  initHook (data: boolean) {}

  run (params: SocketData<this['init']>) {
    const subject$ = new Subject<PortMessage<any>>();

    this.next = (type, data) =>
      subject$.next([type, data]);

    const group$ = subject$.asObservable().pipe(
      groupBy(([type]) => type));

    const namespace = this.namespace();
    inject(this, group$, subject$, namespace, InjectedLifecyclePort);

    this.injectedHook(true)

    return merge(
      this.circuit(),
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
          subject$.complete())),
      catchError((err) => {
        this.error(err);
        return of(['##################', 'error'] as PortMessage<any>)
      }),
    );
  }

  error (err: Error) {
    throw err;
  }

  circuit (): Observable<PortMessage<any>> {
    return lifecycleKit(this)
  }
}

export abstract class InjectedLifecyclePort extends LifecyclePort {}

export const lifecycleKit = (port: LifecyclePort) =>
  merge(
    mapToProc(source(port.start), sink(port.starting), true),
    mapToProc(source(port.started), sink(port.starting), false),
    mapToProc(source(port.started), sink(port.running), true),
    mapToProc(source(port.stop), sink(port.stopping), true),
    mapToProc(source(port.stop), sink(port.running), false),
    mapToProc(source(port.stopped), sink(port.stopping), false),
    mapToProc(source(port.terminate), sink(port.terminating), true),
    mapToProc(source(port.terminated), sink(port.terminating), false),
    restartProc(source(port.restart), source(port.stopped), source(port.started),
      sink(port.stop), sink(port.restarting), sink(port.start), sink(port.restarted))
  )

