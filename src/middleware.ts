export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/goals/:path*',
    '/analytics/:path*',
    '/family/:path*',
    '/invite/:path*',
  ],
}
