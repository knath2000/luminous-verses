import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'

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
    const stackAuthUser = await validateStackAuthUser(email, password)
    console.log('Stack Auth validation result:', stackAuthUser)
    
    if (!stackAuthUser) {
      console.log('User not found in Stack Auth system')
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in Stack Auth system' 
      }, { 
        status: 404,
        headers: corsHeaders 
      })
    }

    console.log('Stack Auth user validated, migrating to Better Auth...')
    
    // Get Better Auth context
    const ctx = await auth.$context
    
    // Check if user already exists in Better Auth
    const existingUser = await ctx.internalAdapter.findUserByEmail(email)
    
    if (existingUser) {
      console.log('User already exists in Better Auth, migration complete')
      return NextResponse.json({
        success: true,
        user: existingUser,
        message: 'User already migrated to Better Auth'
      }, {
        status: 200,
        headers: corsHeaders
      })
    }
    
    // Create user in Better Auth
    console.log('Creating user in Better Auth...')
    const hashedPassword = await ctx.password.hash(password)
    
    const newUser = await ctx.adapter.create({
      model: "user",
      data: {
        email: stackAuthUser.email,
        name: stackAuthUser.name,
        emailVerified: stackAuthUser.emailVerified,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    
    // Create credential account for the user
    await ctx.adapter.create({
      model: "account",
      data: {
        userId: newUser.id,
        accountId: newUser.id,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })
    
    console.log('User successfully migrated to Better Auth')
    
    // Return success response
    return NextResponse.json({
      success: true,
      user: newUser,
      message: 'User successfully migrated to Better Auth'
    }, {
      status: 200,
      headers: corsHeaders
    })

  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error during migration: ' + (error as Error).message
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