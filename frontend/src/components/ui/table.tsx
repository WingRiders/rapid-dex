'use client'

import type * as React from 'react'

import {cn} from '@/lib/utils'

type TableProps = React.ComponentProps<'table'>

export const Table = ({className, ...props}: TableProps) => {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

type TableHeaderProps = React.ComponentProps<'thead'>

export const TableHeader = ({className, ...props}: TableHeaderProps) => {
  return (
    <thead
      data-slot="table-header"
      className={cn('[&_tr]:border-b', className)}
      {...props}
    />
  )
}

type TableBodyProps = React.ComponentProps<'tbody'>

export const TableBody = ({className, ...props}: TableBodyProps) => {
  return (
    <tbody
      data-slot="table-body"
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

type TableFooterProps = React.ComponentProps<'tfoot'>

export const TableFooter = ({className, ...props}: TableFooterProps) => {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
        className,
      )}
      {...props}
    />
  )
}

type TableRowProps = React.ComponentProps<'tr'>

export const TableRow = ({className, ...props}: TableRowProps) => {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
        className,
      )}
      {...props}
    />
  )
}

type TableHeadProps = React.ComponentProps<'th'>

export const TableHead = ({className, ...props}: TableHeadProps) => {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

type TableCellProps = React.ComponentProps<'td'>

export const TableCell = ({className, ...props}: TableCellProps) => {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        className,
      )}
      {...props}
    />
  )
}

type TableCaptionProps = React.ComponentProps<'caption'>

export const TableCaption = ({className, ...props}: TableCaptionProps) => {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}
