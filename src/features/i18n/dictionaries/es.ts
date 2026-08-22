import { esUi } from '@/product/dictionary'
import { esProduct } from '@/product/dictionary'
import { mergeDict } from '@/product/dictionary'
import { type Dict } from './en'

const _es = mergeDict(esUi as Record<string, unknown>, esProduct as Record<string, unknown>)

export const es: Dict = _es as Dict
