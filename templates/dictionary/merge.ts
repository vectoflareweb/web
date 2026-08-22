export function mergeDict<T extends Record<string, unknown>>(ui: T, product: T): T {
  const result: Record<string, unknown> = { ...ui }
  for (const key of Object.keys(product)) {
    const uiVal = ui[key]
    const prodVal = product[key]
    if (
      uiVal !== undefined && prodVal !== undefined &&
      typeof uiVal === 'object' && typeof prodVal === 'object' &&
      !Array.isArray(uiVal) && !Array.isArray(prodVal)
    ) {
      result[key] = mergeDict(uiVal as Record<string, unknown>, prodVal as Record<string, unknown>)
    } else if (prodVal !== undefined) {
      result[key] = prodVal
    }
  }
  return result as T
}
