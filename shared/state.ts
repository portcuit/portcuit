import {EphemeralBoolean} from "pkit";

export type IState = {
  post?: boolean;
  endpoint: string;
  jsAppRoot: string;
  entryPoint: string;
  ssr?: EphemeralBoolean;
  csr?: EphemeralBoolean;
}
