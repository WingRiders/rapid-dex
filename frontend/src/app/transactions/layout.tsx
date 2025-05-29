import {PageContainer} from '@/components/page-container'

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <PageContainer>
      <h2 className="font-bold text-2xl">Your transactions</h2>

      <div className="mt-4">{children}</div>
    </PageContainer>
  )
}

export default RootLayout
