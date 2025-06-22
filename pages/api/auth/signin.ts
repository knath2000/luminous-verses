import { NextApiRequest, NextApiResponse } from 'next';
// import { stackServerApp } from '../../../src/stack';

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

    // Temporary implementation: For testing purposes, we'll accept any reasonable credentials
    // TODO: Implement proper Stack Auth server-side integration
    
    // Basic validation
    if (password.length < 6) {
      return res.status(401).json({ 
        message: 'Password must be at least 6 characters',
        success: false 
      });
    }

    // For testing, allow common test accounts and the user's email
    const allowedEmails = [
      'knath2000@icloud.com',
      'test@example.com',
      'user@test.com'
    ];

    if (!allowedEmails.includes(email.toLowerCase())) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false 
      });
    }

    // Return mock user data for successful authentication
    const userId = email.split('@')[0];
    return res.status(200).json({
      success: true,
      user: {
        id: `user_${userId}`,
        email: email,
        emailVerified: true,
        displayName: userId.charAt(0).toUpperCase() + userId.slice(1),
        profileImageUrl: null,
      },
      accessToken: `token_${userId}_${Date.now()}`, // Mock token for backend authentication
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