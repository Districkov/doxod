import { redirect } from 'next/navigation'

export default async function Home() {
  try {
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    if (session?.user) {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Auth error:', error)
    // Если auth не работает, редиректим на login
  }
  
  redirect('/login')
}
