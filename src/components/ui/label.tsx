import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>

export function Label({ className, ...props }: LabelProps) {
  return <LabelPrimitive.Root className={cn('text-[13px] font-semibold text-foreground', className)} {...props} />
}
