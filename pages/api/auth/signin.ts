import { NextApiRequest, NextApiResponse } from 'next';
// import { stackServerApp } from '../../../src/stack';

// Mock user database for testing - in production this would be a real database
const MOCK_USERS = {
  'testuser@luminousverses.com': {
    password: 'testpass123', // Test password for demo
    id: 'user_testuser',
    displayName: 'Test User',
    emailVerified: true,
  },
  'demo@example.com': {
    password: 'demopass123',
    id: 'user_demo',
    displayName: 'Demo User',
    emailVerified: true,
  },
  'user@test.com': {
    password: 'password123',
    id: 'user_testuser2',
    displayName: 'Test User 2',
    emailVerified: false,
  }
};

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

    // Normalize email for lookup
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if user exists
    const user = MOCK_USERS[normalizedEmail as keyof typeof MOCK_USERS];
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false 
      });
    }

    // Validate password
    if (user.password !== password) {
      return res.status(401).json({ 
        message: 'Invalid email or password',
        success: false 
      });
    }

    // Return user data for successful authentication
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: normalizedEmail,
        emailVerified: user.emailVerified,
        displayName: user.displayName,
        profileImageUrl: null,
      },
      accessToken: `token_${user.id}_${Date.now()}`, // Mock token for backend authentication
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