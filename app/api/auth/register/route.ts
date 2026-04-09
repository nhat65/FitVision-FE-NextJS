import { NextRequest, NextResponse } from 'next/server'
import { getAPIUrl } from '@/lib/api-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, height, weight, fitnessLevel, fitnessGoal } = body

    if (!email || !password || !name || !height || !weight || !fitnessLevel || !fitnessGoal) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const backendUrl = getAPIUrl('auth/register')
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        height: Number(height),
        weight: Number(weight),
        fitnessLevel,
        fitnessGoal,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.message || 'Registration failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[v0] Register API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
