type StringLiteral<T> = T extends string ? (string extends T ? never : T) : never

declare const __OPAQUE_TYPE__: unique symbol

/** Easily create opaque types ie. types that are subset of their original types (ex: positive numbers, uppercased string) */
export type Opaque<Type, Token extends string> = Token extends StringLiteral<Token>
  ? Type & { readonly [__OPAQUE_TYPE__]: Token }
  : never

export type FullStamp = Opaque<string, 'FullStamp'>

export function getFullStamp(uniqueId: string): FullStamp {
  return `<!-- @superactions/comment/${uniqueId} -->` as any
}

export function attachStampToBody({ uniqueId, body }: { uniqueId: string; body: string }): string {
  const fullStamp = getFullStamp(uniqueId)

  if (body.includes(fullStamp)) {
    return body
  } else {
    return body + fullStamp
  }
}
