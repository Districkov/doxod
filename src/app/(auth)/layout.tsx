export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen h-[100dvh] items-center justify-center bg-muted/30 p-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
