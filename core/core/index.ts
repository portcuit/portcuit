import {PortMessage, Socket} from './processors'
import {entry, defaultLogger} from './processors'
import {tap} from "rxjs/operators";
import {Observable, of, Subject} from "rxjs";

export * from './processors'

export class LifecyclePort<T=any> {
  init = new Socket<T>();
  ready = new Socket<any>();
  terminate = new Socket<any>();
  terminated = new Socket<any>();
  quit = new Socket<any>();
  info = new Socket<any>();
  debug = new Socket<any>();
  running = new Socket<boolean>();
  err = new Socket<Error>();

  entry(circuit: (port: this) => Observable<PortMessage<any>>, params?: T, logger?: (...args: any[]) => void): Subject<PortMessage<any>>;
  entry(params?: T, logger?: (...args: any[]) => void): Subject<PortMessage<any>>;

  entry(...args: any[]) {
    let circuit, params, logger;
    if (typeof args[0] === 'function') {
      circuit = args[0];
      params = args[1];
      logger = args[2] || defaultLogger;
    } else {
      circuit = this.circuit.bind(this);
      params = args[0];
      logger = args[1] || defaultLogger;
    }

    const subject$ = entry(this as any, circuit as any, params, logger);
    subject$.pipe(tap(([type]) =>
      type === 'terminated' &&
      subject$.complete()))
      .subscribe({error: this.error.bind(this)})

    return subject$;
  }

  error (err: Error) {
    throw err;
  }

  circuit (...args: any[]) {
    throw new Error('need implement')
  }
}

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}
