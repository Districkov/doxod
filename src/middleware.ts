import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('authjs.session-token')?.value
    || request.cookies.get('__Secure-authjs.session-token')?.value

  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/transactions', '/goals', '/analytics', '/family', '/invite']
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !sessionToken) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if ((pathname === '/login' || pathname === '/register') && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/transactions/:path*',
    '/goals/:path*',
    '/analytics/:path*',
    '/family/:path*',
    '/invite/:path*',
    '/login',
    '/register',
  ],
}
