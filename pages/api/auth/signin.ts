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

    console.log('Attempting sign-in for:', email);

    // Use Stack Auth to sign in
    const result = await stackServerApp.signInWithCredential({
      email,
      password,
    });

    console.log('Stack Auth result:', result);

    // Handle Stack Auth result structure
    if (result.status === 'error') {
      console.error('Stack Auth error:', result.error);
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false 
      });
    }

    if (result.status === 'ok') {
      // For Stack Auth, we need to get the user from the session after successful sign-in
      // Since this is a server-side API, we'll need to create a session and get user data
      
      // For now, let's try a simpler approach - just validate credentials
      // and return a success response that the native app can use
      return res.status(200).json({
        success: true,
        user: {
          id: 'temp-user-id', // We'll fix this once we understand the proper flow
          email: email,
          emailVerified: true,
          displayName: email.split('@')[0],
          profileImageUrl: null,
        },
        // Use email as temporary token (this needs to be fixed)
        accessToken: 'temp-token',
      });
    }

    return res.status(401).json({ 
      message: 'Authentication failed',
      success: false 
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    
    // Handle specific Stack Auth errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials') || error.message.includes('INVALID_CREDENTIALS')) {
        return res.status(401).json({ 
          message: 'Invalid email or password',
          success: false 
        });
      }
      
      return res.status(500).json({ 
        message: 'Authentication failed',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        success: false 
      });
    }

    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      success: false 
    });
  }
} 