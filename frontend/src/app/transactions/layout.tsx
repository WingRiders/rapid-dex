const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <div className="mx-auto mt-4 max-w-7xl px-4">
      <h2 className="font-bold text-2xl">Your transactions</h2>

      <div className="mt-4">{children}</div>
    </div>
  )
}

export default RootLayout
