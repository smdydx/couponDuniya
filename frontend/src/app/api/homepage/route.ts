
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const backendUrl = `http://127.0.0.1:8000/api/v1/homepage/?${queryString}`;
    
    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Forward the authorization header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
      cache: 'no-store', // Prevent caching to ensure fresh data
    });
    
    if (!response.ok) {
      console.error('Backend homepage error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch homepage data' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Homepage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
