import {Socket} from './processors'
import {entry, defaultLogger} from './processors'
import {tap} from "rxjs/operators";

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

  entry(params: T, logger = defaultLogger) {
    const subject$ = entry(this as any, this.circuit.bind(this) as any, params, logger);
    subject$.pipe(tap(([type]) =>
      type === 'terminated' &&
      subject$.complete()))
      .subscribe({error: this.error.bind(this)})
    return subject$;
  }

  error (err: Error) {
    throw err;
  }

  circuit (params: T) {
    throw new Error('need implement')
  }
}

export class EndpointPort<T, U, V = Error> {
  req = new Socket<T>();
  res = new Socket<U>();
  err = new Socket<V>();
}
