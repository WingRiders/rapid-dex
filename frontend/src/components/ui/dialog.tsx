'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import {XIcon} from 'lucide-react'
import type * as React from 'react'

import {cn} from '@/lib/utils'

export type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>
export const Dialog = ({...props}: DialogProps) => (
  <DialogPrimitive.Root data-slot="dialog" {...props} />
)

export type DialogTriggerProps = React.ComponentProps<
  typeof DialogPrimitive.Trigger
>
export const DialogTrigger = ({...props}: DialogTriggerProps) => (
  <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
)

export type DialogPortalProps = React.ComponentProps<
  typeof DialogPrimitive.Portal
>
export const DialogPortal = ({...props}: DialogPortalProps) => (
  <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
)

export type DialogCloseProps = React.ComponentProps<
  typeof DialogPrimitive.Close
>
export const DialogClose = ({...props}: DialogCloseProps) => (
  <DialogPrimitive.Close data-slot="dialog-close" {...props} />
)

export type DialogOverlayProps = React.ComponentProps<
  typeof DialogPrimitive.Overlay
>
export const DialogOverlay = ({className, ...props}: DialogOverlayProps) => (
  <DialogPrimitive.Overlay
    data-slot="dialog-overlay"
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=open]:animate-in',
      className,
    )}
    {...props}
  />
)

export type DialogContentProps = React.ComponentProps<
  typeof DialogPrimitive.Content
>
export const DialogContent = ({
  className,
  children,
  ...props
}: DialogContentProps) => (
  <DialogPortal data-slot="dialog-portal">
    <DialogOverlay />
    <DialogPrimitive.Content
      data-slot="dialog-content"
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:max-w-lg',
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0">
        <XIcon />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
)

export type DialogHeaderProps = React.ComponentProps<'div'>
export const DialogHeader = ({className, ...props}: DialogHeaderProps) => (
  <div
    data-slot="dialog-header"
    className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
    {...props}
  />
)

export type DialogFooterProps = React.ComponentProps<'div'>
export const DialogFooter = ({className, ...props}: DialogFooterProps) => (
  <div
    data-slot="dialog-footer"
    className={cn(
      'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
      className,
    )}
    {...props}
  />
)

export type DialogTitleProps = React.ComponentProps<
  typeof DialogPrimitive.Title
>
export const DialogTitle = ({className, ...props}: DialogTitleProps) => (
  <DialogPrimitive.Title
    data-slot="dialog-title"
    className={cn('font-semibold text-lg leading-none', className)}
    {...props}
  />
)

export type DialogDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>
export const DialogDescription = ({
  className,
  ...props
}: DialogDescriptionProps) => (
  <DialogPrimitive.Description
    data-slot="dialog-description"
    className={cn('text-muted-foreground text-sm', className)}
    {...props}
  />
)
