import {HydrationBoundary, dehydrate} from '@tanstack/react-query'
import type {ReactNode} from 'react'
import {getQueryClient} from '../trpc/server'

type HydrateClientProps = {
  children: ReactNode
}

export const HydrateClient = ({children}: HydrateClientProps) => {
  const queryClient = getQueryClient()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
