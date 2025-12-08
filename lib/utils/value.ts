export const isDefined = <T>(value: T | undefined): value is T => value !== undefined

export const isNullish = (value: unknown): value is null | undefined => value === null || value === undefined

export const isPresent = <T>(value: T | null | undefined): value is T => !isNullish(value)

export const normalizeNullable = <T>(value: T | null | undefined): T | null => (value === undefined ? null : value)

export const ensureArray = <T>(input: T | T[] | null | undefined): T[] => {
  if (Array.isArray(input)) return input
  if (isNullish(input)) return []
  return [input]
}

export const coalesce = <T>(...values: Array<T | null | undefined>): T | undefined => {
  for (const value of values) {
    if (isPresent(value)) {
      return value
    }
  }
  return undefined
}
