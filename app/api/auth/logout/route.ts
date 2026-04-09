import { NextRequest, NextResponse } from 'next/server'
import { getAPIUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refreshToken } = body

    if (refreshToken) {
      const backendUrl = getAPIUrl('auth/logout')
      await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(error => {
        console.error('[v0] Logout notification error:', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Logout API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
