import {EphemeralBoolean, EphemeralString} from "pkit";

export type IState = {
  post?: boolean;
  endpoint: string;
  jsAppRoot: string;
  entryPoint: string;
  flag: {
    method?: EphemeralString;
    render?: EphemeralBoolean;
    noRender?: EphemeralBoolean;
  }
}
