import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// POST - Enroll user in program
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const url = `${BACKEND_URL}/api/subscriptions/enroll`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('[Enroll API Error]', error)
    return NextResponse.json(
      { error: 'Failed to enroll in program' },
      { status: 500 }
    )
  }
}
