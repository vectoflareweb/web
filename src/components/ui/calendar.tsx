import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-1', className)}
      classNames={{
        months: 'flex flex-col gap-3',
        month: 'flex flex-col gap-3',
        month_caption: 'flex justify-center pt-1 relative items-center h-9',
        caption_label: 'text-sm font-semibold',
        nav: 'flex items-center gap-1 absolute inset-x-0 top-1 justify-between px-1',
        button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7'),
        button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7'),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-fg-3 w-9 text-[12px] font-normal',
        week: 'flex w-full mt-1',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(buttonVariants({ variant: 'ghost' }), 'h-9 w-9 p-0 font-normal'),
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary-hover',
        today: '[&>button]:border [&>button]:border-border-strong',
        outside: 'text-fg-3 opacity-50',
        disabled: 'text-fg-3 opacity-40',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />,
      }}
      {...props}
    />
  )
}
