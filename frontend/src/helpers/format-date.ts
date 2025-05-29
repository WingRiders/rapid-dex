import {format} from 'date-fns'

export const formatDateTime = (date: Date) => {
  return format(date, 'dd MMM yyyy HH:mm:ss')
}
