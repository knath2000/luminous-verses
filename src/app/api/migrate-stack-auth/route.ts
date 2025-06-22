import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Enable CORS for native app requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const { email, password } = await req.json()
    console.log('Stack Auth migration attempt for:', email)

    // Check if this is a known Stack Auth user
    const isStackAuthUser = await validateStackAuthUser(email, password)
    console.log('Stack Auth validation result:', isStackAuthUser)
    
    if (!isStackAuthUser) {
      console.log('User not found in Stack Auth system')
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in Stack Auth system' 
      }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    console.log('Stack Auth user validated, preparing response...')
    
    // Return success response for Stack Auth user
    return NextResponse.json({
      success: true,
      user: isStackAuthUser,
      message: 'Stack Auth user validated'
    }, {
      status: 200,
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error during migration' 
    }, { 
      status: 500,
      headers: corsHeaders 
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

// Stack Auth user validation function
async function validateStackAuthUser(email: string, password: string) {
  // Known Stack Auth users (replace with actual database queries)
  const stackAuthUsers = {
    'knath2000@icloud.com': {
      id: 'stack_auth_user_1',
      email: 'knath2000@icloud.com',
      name: 'Kalyan',
      emailVerified: true,
      // In production, you'd validate against the actual Stack Auth password hash
      isValid: password.length >= 6 // Simplified validation for demo
    }
  }

  const user = stackAuthUsers[email as keyof typeof stackAuthUsers]
  
  if (user && user.isValid) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified
    }
  }
  
  return null
} 