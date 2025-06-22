import { NextApiRequest, NextApiResponse } from 'next';
import { stackServerApp } from '../../../src/stack';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS for the native app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Attempting sign-up for:', email);

    // Use Stack Auth to create user
    const result = await stackServerApp.signUpWithCredential({
      email,
      password,
    });

    console.log('Stack Auth signup result:', result);

    // Handle Stack Auth result structure
    if (result.status === 'error') {
      console.error('Stack Auth error:', result.error);
      
      // Handle specific error types
      if (result.error.message?.includes('already exists')) {
        return res.status(409).json({ 
          message: 'An account with this email already exists',
          success: false 
        });
      }
      
      return res.status(400).json({ 
        message: 'Sign-up failed. Please check your information.',
        success: false 
      });
    }

    if (result.status === 'ok') {
      // For now, return a success response
      // TODO: Get actual user data from Stack Auth after signup
      return res.status(201).json({
        success: true,
        user: {
          id: 'temp-signup-user-id', // We'll fix this once we understand the proper flow
          email: email,
          emailVerified: false,
          displayName: email.split('@')[0],
          profileImageUrl: null,
        },
        // Use email as temporary token (this needs to be fixed)
        accessToken: 'temp-signup-token',
      });
    }

    return res.status(400).json({ 
      message: 'Sign-up failed',
      success: false 
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    
    // Handle specific Stack Auth errors
    if (error instanceof Error) {
      if (error.message.includes('already exists') || error.message.includes('DUPLICATE_EMAIL')) {
        return res.status(409).json({ 
          message: 'An account with this email already exists',
          success: false 
        });
      }
      
      if (error.message.includes('password') || error.message.includes('WEAK_PASSWORD')) {
        return res.status(400).json({ 
          message: 'Password does not meet requirements',
          success: false 
        });
      }
      
      return res.status(500).json({ 
        message: 'Registration failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        success: false 
      });
    }

    return res.status(500).json({ 
      message: 'An unexpected error occurred during registration',
      success: false 
    });
  }
} 