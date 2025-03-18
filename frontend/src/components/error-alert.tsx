import {AlertCircle} from 'lucide-react'
import {Alert, AlertDescription, AlertTitle} from './ui/alert'

type ErrorAlertProps = {
  title?: string
  description?: string
  className?: string
}

export const ErrorAlert = ({
  title,
  description,
  className,
}: ErrorAlertProps) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      {title != null && <AlertTitle>{title}</AlertTitle>}
      {description != null && (
        <AlertDescription className="break-all">{description}</AlertDescription>
      )}
    </Alert>
  )
}
