import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[12px] font-semibold leading-[1.4] whitespace-nowrap',
  {
    variants: {
      variant: {
        free: 'bg-inset text-fg-2 border border-border',
        pro: 'bg-soft text-primary',
        ok: 'text-success bg-[color-mix(in_srgb,var(--success)_16%,transparent)]',
        warn: 'text-destructive bg-[color-mix(in_srgb,var(--destructive)_15%,transparent)]',
      },
    },
    defaultVariants: { variant: 'free' },
  },
)

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({ variant, dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
