import type {ReactNode} from 'react'

type DataRowsProps = {
  rows: {
    label: string
    value: string | ReactNode
  }[]
  className?: string
}

export const DataRows = ({rows, className}: DataRowsProps) => {
  return (
    <div className={className}>
      {rows.map(({label, value}) => (
        <div key={label} className="flex flex-row justify-between">
          <p className="text-md text-muted-foreground">{label}</p>
          <p className="text-md">{value}</p>
        </div>
      ))}
    </div>
  )
}
