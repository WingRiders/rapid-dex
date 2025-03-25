'use client'

import * as AccordionPrimitive from '@radix-ui/react-accordion'
import {ChevronDownIcon} from 'lucide-react'
import type * as React from 'react'

import {cn} from '@/lib/utils'

type AccordionProps = React.ComponentProps<typeof AccordionPrimitive.Root>
export const Accordion = ({...props}: AccordionProps) => {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

type AccordionItemProps = React.ComponentProps<typeof AccordionPrimitive.Item>
export const AccordionItem = ({className, ...props}: AccordionItemProps) => {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  )
}

type AccordionTriggerProps = React.ComponentProps<
  typeof AccordionPrimitive.Trigger
>
export const AccordionTrigger = ({
  className,
  children,
  ...props
}: AccordionTriggerProps) => {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          'flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left font-medium text-sm outline-none transition-all hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

type AccordionContentProps = React.ComponentProps<
  typeof AccordionPrimitive.Content
>
export const AccordionContent = ({
  className,
  children,
  ...props
}: AccordionContentProps) => {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="animated-accordion-content overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn('pt-0 pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}
