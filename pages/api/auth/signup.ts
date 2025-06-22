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

    console.log('Attempting sign-up for:', email);

    // Temporary implementation: For testing purposes, accept sign-ups
    // TODO: Implement proper Stack Auth server-side integration
    
    // Basic validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters',
        success: false 
      });
    }

    // For testing, check if email already "exists"
    const existingEmails = ['existing@example.com']; // Mock existing emails
    
    if (existingEmails.includes(email.toLowerCase())) {
      return res.status(409).json({ 
        message: 'An account with this email already exists',
        success: false 
      });
    }

    // Return mock user data for successful sign-up
    const userId = email.split('@')[0];
    return res.status(201).json({
      success: true,
      user: {
        id: `user_${userId}`,
        email: email,
        emailVerified: false, // New accounts start unverified
        displayName: userId.charAt(0).toUpperCase() + userId.slice(1),
        profileImageUrl: null,
      },
      accessToken: `token_${userId}_${Date.now()}`, // Mock token for backend authentication
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