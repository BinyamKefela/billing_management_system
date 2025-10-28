import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is a placeholder for your actual token validation logic.
// In a real application, you would verify the token's signature,
// check its expiration date, and ensure it hasn't been tampered with.
const isValidToken = (token: string): boolean => {
  // Your token validation logic goes here.
  // For example, you might use a library like 'jsonwebtoken' to verify it.
  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
  //   return decoded && decoded.exp > Date.now() / 1000;
  // } catch (e) {
  //   return false;
  // }

  // For this example, we'll just check if the token exists and is a non-empty string.
  // DO NOT use this simple check in a production application.
  return !!token && token.length > 0;
};

export function middleware(request: NextRequest) {
  // Define the protected routes. Any path that starts with '/dashboard' will be protected.
  const protectedPaths = ['/dashboard'];

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If the path is not a protected route, we can skip the authentication check.
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Retrieve the token from the cookies.
  const token = request.cookies.get('token')?.value;

  // Check if the token is valid.
  const isTokenValid = token ? isValidToken(token) : false;

  // If the token is not valid, redirect the user to the login page.
  if (!isTokenValid) {
    const loginUrl = new URL('/auth/login', request.url);
    // You can add a 'redirect' query parameter to the login URL
    // so the user is sent back to the page they were trying to access.
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If the token is valid, allow the request to proceed.
  return NextResponse.next();
}

// Configure the matcher to run this middleware only on the specified paths.
// This is more efficient than checking all routes manually inside the function.
export const config = {
  matcher: [
    '/dashboard/:path*', // Matches /dashboard and all sub-paths
    // Add other protected routes here as needed, e.g., '/profile', '/settings'
  ],
};
