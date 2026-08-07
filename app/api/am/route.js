import { NextResponse } from 'next/server';

const API = 'https://restapidhan.vercel.app';

export const runtime = 'nodejs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const action = searchParams.get('action');
  const email = searchParams.get('email');
  const url = searchParams.get('url');

  const APIKEY = process.env.AM_API_KEY;

  if (!APIKEY) {
    return NextResponse.json(
      {
        status: false,
        error:
          'AM_API_KEY belum dikonfigurasi di Vercel.'
      },
      { status: 500 }
    );
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json(
      {
        status: false,
        error: 'Email tidak valid.'
      },
      { status: 400 }
    );
  }

  if (
    action !== 'send' &&
    action !== 'verif'
  ) {
    return NextResponse.json(
      {
        status: false,
        error: 'Action tidak valid.'
      },
      { status: 400 }
    );
  }

  if (
    action === 'verif' &&
    (!url || !url.startsWith('http'))
  ) {
    return NextResponse.json(
      {
        status: false,
        error: 'URL verifikasi tidak valid.'
      },
      { status: 400 }
    );
  }

  try {
    const endpoint =
      new URL(`${API}/api/am`);

    endpoint.searchParams.set(
      'action',
      action
    );

    endpoint.searchParams.set(
      'apikey',
      APIKEY
    );

    endpoint.searchParams.set(
      'email',
      email
    );

    if (action === 'verif') {
      endpoint.searchParams.set(
        'url',
        url
      );
    }

    const response = await fetch(
      endpoint,
      {
        cache: 'no-store'
      }
    );

    const data = await response.json();

    return NextResponse.json(
      data,
      {
        status:
          response.ok
            ? 200
            : response.status
      }
    );

  } catch (error) {
    return NextResponse.json(
      {
        status: false,
        error:
          error.message ||
          'API error'
      },
      { status: 502 }
    );
  }
}
