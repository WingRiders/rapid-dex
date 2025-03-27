import type {ReactNode} from 'react'
import {cn} from '../lib/utils'

type DataRowsProps = {
  rows: {
    label: string
    value: string | ReactNode
  }[]
  className?: string
}

export const DataRows = ({rows, className}: DataRowsProps) => {
  if (rows.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {rows.map(({label, value}) => (
        <div key={label} className="flex flex-row justify-between">
          <p className="text-md text-muted-foreground">{label}</p>
          {typeof value === 'string' ? (
            <p className="text-md">{value}</p>
          ) : (
            value
          )}
        </div>
      ))}
    </div>
  )
}
