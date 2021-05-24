declare module 'json8' {
  export const clone: <T>(data: T) => T
}

declare module 'json8-merge-patch' {
  export const apply: (doc: any, patch: any) => any
}