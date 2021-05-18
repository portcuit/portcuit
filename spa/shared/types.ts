export type SpaCsr = {
  endpoint: string;
  entrypoint: string
}

export type FlowEvent = {
  path: Array<string | number>;
  detail: any;
}
