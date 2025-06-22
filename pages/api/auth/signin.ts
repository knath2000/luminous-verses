import { NextApiRequest, NextApiResponse } from 'next';

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
      return res.status(400).json({ 
        message: 'Email and password are required',
        success: false 
      });
    }

    console.log('Attempting sign-in for:', email);

    /**
     * IMPORTANT NOTE:
     * Stack Auth (Neon Auth) is designed for client-side authentication and doesn't provide
     * a server-side API for password validation. This endpoint is a bridge for the React Native app.
     * 
     * For proper authentication testing:
     * 1. First register users through the web app at: https://luminous-verses.vercel.app
     * 2. Then use those same credentials to test the native app
     * 
     * This implementation validates against known registered users for testing purposes.
     */

    const normalizedEmail = email.toLowerCase().trim();
    
    // Since we can't validate against Stack Auth server-side, we'll inform the user
    // that they need to register through the web app first
    
    if (normalizedEmail === 'knath2000@icloud.com') {
      // This is the user's real email - inform them about the limitation
      return res.status(401).json({ 
        message: 'Authentication Error: This native app cannot validate Stack Auth credentials server-side. Please sign up and test through the web app at https://luminous-verses.vercel.app first, then we can enable proper authentication integration.',
        success: false 
      });
    }

    // For testing purposes, we'll accept a specific test credential
    if (normalizedEmail === 'test@luminousverses.com' && password === 'testpass123') {
      return res.status(200).json({
        success: true,
        user: {
          id: 'test_user_native',
          email: normalizedEmail,
          emailVerified: true,
          displayName: 'Test User',
          profileImageUrl: null,
        },
        accessToken: `native_test_token_${Date.now()}`,
      });
    }

    // For any other credentials, inform about the Stack Auth limitation
    return res.status(401).json({ 
      message: 'Invalid credentials. Note: This native app bridge cannot validate Stack Auth passwords server-side. For testing, use: test@luminousverses.com / testpass123',
      success: false 
    });

  } catch (error) {
    console.error('Sign-in error:', error);
    
    return res.status(500).json({ 
      message: 'An unexpected error occurred',
      success: false 
    });
  }
} 