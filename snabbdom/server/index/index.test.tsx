import test, {ExecutionContext} from 'ava'
import {mapProc, mapToProc, PortParams, sink, Socket, source} from '@pkit/core'
import Pkit from '@pkit/snabbdom'
import {merge} from 'rxjs'
import {filter} from 'rxjs/operators'
import {SnabbdomServerPort} from './'

const View = (msg: string) =>
  <p>{msg}</p>

class SnabbdomServerTestPort extends SnabbdomServerPort {
  init = new Socket<{
    t: ExecutionContext
  } & PortParams<SnabbdomServerPort>>()

  testFlow = (port: this, {t}: PortParams<this>) =>
    merge(
      mapProc(source(port.ready), sink(port.render), () =>
        View('Hello World!')),

      mapToProc(source(port.html).pipe(
        filter((html) =>
          t.is(html, '<!DOCTYPE html><p>Hello World!</p>') === undefined)),
        sink(port.terminated))
    )
}

test('render', async (t) => {
  await new SnabbdomServerTestPort({log: t.log}).run({fragment: true, t}).toPromise()
  t.pass()
})
