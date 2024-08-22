import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/server/supabase';

export async function authenticateAndInitialize(req: NextRequest) {
  try {
    // Validate Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid Authorization header');
      throw new Error('Authentication failed.');
    }

    // Extract token from the Authorization header
    const incomingToken = authHeader.split(' ')[1];

    // Validate the session and retrieve user details
    const userid = await validateSession(incomingToken);

    // Initialize Pinecone index
    return {
      userid
    };
  } catch (e: unknown) {
    // Logging and re-throwing the error for higher-level handling
    if (e instanceof Error) {
      console.error(
        `Error during authentication and initialization: ${e.message}`
      );
    }
    throw new Error(
      'An error occurred during authentication and initialization.'
    );
  }
}
/**
 * Validates the user session based on the incoming token.
 * @param incomingToken - The token to validate.
 * @returns An object containing the session and user details.
 */
async function validateSession(incomingToken: string) {
  const session = await getSession();
  if (!session || session.id !== incomingToken) {
    console.error('Session not found or invalid token');
    throw new Error('Authentication failed.');
  }

  return { session };
}
