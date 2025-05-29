import {cn} from '@/lib/utils'
import {type VariantProps, cva} from 'class-variance-authority'
import type {ReactNode} from 'react'

const pageContainerVariants = cva('mx-auto my-4 px-4', {
  variants: {
    width: {
      small: 'max-w-2xl',
      large: 'max-w-7xl',
    },
  },
  defaultVariants: {
    width: 'large',
  },
})

type PageContainerProps = {
  children?: ReactNode
  className?: string
} & VariantProps<typeof pageContainerVariants>

export const PageContainer = ({
  children,
  width,
  className,
}: PageContainerProps) => {
  return (
    <div className={cn(pageContainerVariants({width, className}))}>
      {children}
    </div>
  )
}
