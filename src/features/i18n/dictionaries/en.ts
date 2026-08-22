import { enUi } from '@/product/dictionary'
import { enProduct } from '@/product/dictionary'
import { mergeDict } from '@/product/dictionary'

const _en = mergeDict(enUi as Record<string, unknown>, enProduct as Record<string, unknown>)

export const en = _en as typeof enUi & typeof enProduct

type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> }
export type Dict = Widen<typeof en>
