import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // If there's an error from Google
    if (error) {
        return NextResponse.redirect(new URL(`/settings?error=${error}`, request.url));
    }

    // If no code, just send them back
    if (!code) {
        return NextResponse.redirect(new URL('/settings', request.url));
    }

    try {
        // Exchange code with our FastAPI backend
        const redirect_uri = request.url.split('?')[0]; // Use the current URL without query params
        const response = await fetch('http://localhost:8000/api/youtube/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirect_uri }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('FastAPI OAuth Exchange Failed:', errorData);
            return NextResponse.redirect(new URL(`/settings?error=exchange_failed`, request.url));
        }

        // Success! Back to settings
        return NextResponse.redirect(new URL('/settings?success=true', request.url));
    } catch (err) {
        console.error('OAuth Callback Bridge Error:', err);
        return NextResponse.redirect(new URL('/settings?error=server_error', request.url));
    }
}
