import { isDefined, isNullish } from './value'

export const withOptionalField = <T extends object, K extends keyof T>(
  target: Partial<T>,
  key: K,
  value: T[K] | undefined,
  transform?: (current: NonNullable<T[K]>) => T[K]
) => {
  if (!isDefined(value)) return
  const nextValue = transform && value !== null ? transform(value as NonNullable<T[K]>) : value
  target[key] = nextValue as T[K]
}

export const assignIfPresent = <T extends object, K extends keyof T>(
  target: Partial<T>,
  key: K,
  value: T[K] | null | undefined
) => {
  if (isNullish(value)) return
  target[key] = value as T[K]
}

export const assignWhen = <T extends object, K extends keyof T>(
  target: Partial<T>,
  key: K,
  value: T[K],
  predicate: (value: T[K]) => boolean
) => {
  if (!predicate(value)) return
  target[key] = value
}
