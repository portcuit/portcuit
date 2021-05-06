import {EphemeralBoolean} from "@pkit/core";

export type NextState = {
  ssr: {
    method?: string
  };
  req: {
    render?: EphemeralBoolean;
  };
  doing: object;
  res: {
    init?: EphemeralBoolean;
  };
  // err: object;
}

export namespace NextState {
  export const initialState = (): NextState =>
    ({
      ssr: {},
      req: {},
      doing: {},
      res: {
        init: new EphemeralBoolean(true),
      },
      // err: {}
    });
}

export type NextCsrState = {
  csr: {
    docRoot: string;
    endpoint: string;
    entrypoint: string;
  };
  req: {
    externalApi?: EphemeralBoolean;
  };
  doing: {
    hydrate: boolean;
    externalApi?: boolean;
  };
  done: {
    hydrate: boolean;
  }
  res: {
    hydrate?: EphemeralBoolean;
    externalApi?: EphemeralBoolean;
  };
} & NextState

export namespace NextCsrState {
  export const initialState  = (): Omit<NextCsrState, 'csr'> =>
    ({
      ...NextState.initialState(),
      doing: {hydrate: true},
      done: {hydrate: false}
    });
}