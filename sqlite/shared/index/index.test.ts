import {SqlitePort} from "./index";
import {
  latestMapProc,
  LifecyclePort, mapProc,
  mapToProc,
  PortParams,
  sink,
  Socket,
  source
} from "@pkit/core";
import {merge} from "rxjs";
import {toArray} from "rxjs/operators";
import {SqliteServerStoragePort} from "../../server/storage/index";

// class MyTestPort extends LifecyclePort {
//   init = new Socket<PortParams<SqliteSourcePort>>();
//   store = new SqliteSourcePort({storage: new SqliteServerStoragePort})
//
//   circuit() {
//     const port = this;
//     return merge(
//       port.store.circuit(),
//
//       mapProc(source(port.init), sink(port.store.init),
//         (params) => params),
//
//       mapToProc(source(port.store.rec), sink(port.store.use.req)),
//       mapToProc(source(port.store.use.res), sink(port.terminated))
//     );
//   }
// }
//
//
// test('store', async () => {
//   const logs = await new MyTestPort()
//     .stream({
//       Record: MyRecord,
//       sqlite: `${process.cwd()}/src/app/nhk_radio/shared/db/player.sqlite`
//     }).pipe(toArray()).toPromise();
//
//   console.log(logs);
// });
//
