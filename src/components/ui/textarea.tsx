import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.ComponentProps<'textarea'>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'w-full min-h-[80px] resize-y rounded-[7px] border border-input bg-background px-3 py-2 text-sm text-foreground',
        'placeholder:text-fg-3 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  )
}
