import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { File, Folder, Files } from 'fumadocs-ui/components/files'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    File,
    Folder,
    Files,
    TypeTable,
    Accordion,
    Accordions,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents
