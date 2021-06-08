export type SqliteQueryUnit<T, U> = {
  prepare: (arg: T) => Prepare<'query'>;
  asObject: AsObject<U>;
  jsonKeys?: ReadonlyArray<keyof U>;
}

export type SqliteCommandUnit<T> = {
  prepare: (arg: T) => Prepare<'command'>
}

export type Prepare<T extends string = 'query' | 'command'> = {
  sql: string;
  params?: Array<string | number | Uint8Array | null>,
  type: T
}

export type AsObject<T extends {[key: string]: any}> = {
  (data: Array<{columns: string[], values: any[][]}>, jsonKeys?: ReadonlyArray<keyof T>): Array<T>
}

export function asObject<T extends {[key: string]: any}> (data: Array<{columns: string[], values: any[][]}>, jsonKeys: ReadonlyArray<keyof T> = []) {
  if (!(data?.length >= 1)) {return [];}
  const [{columns, values}] = data;
  return values.map((fields) =>
    fields.reduce((memo, curr, index) =>
    ({
      ...memo,
      [columns[index]]: jsonKeys.includes(columns[index]) ? JSON.parse(curr) : curr
    }), {})) as T[];
}

export type SqlJsDatabase<T extends {
  (config?: any): Promise<{
    Database: new (...args: any[]) => any
  }>;
  readonly default: any;
}> = InstanceType<InferDatabase<T>['Database']>

export type InferDatabase<T> = T extends {
  (config?: any): Promise<infer I>;
  readonly default: any;
} ? I : never;
