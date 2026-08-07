import { NextResponse } from 'next/server';

const API =
  'https://restapidhan.vercel.app';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();

    const {
      action,
      email,
      url,
      key
    } = body;

    const apiKey =
      process.env.AM_API_KEY;


    /* =====================
       SEND MAGIC LINK
    ===================== */

    if (action === 'send') {

      if (
        !email ||
        !email.includes('@')
      ) {
        return NextResponse.json({
          status: false,
          error: 'Email tidak valid.'
        });
      }

      if (!apiKey) {
        return NextResponse.json({
          status: false,
          error:
            'AM_API_KEY belum dikonfigurasi di Vercel.'
        });
      }

      const endpoint =
        `${API}/api/am` +
        `?action=send` +
        `&apikey=${encodeURIComponent(apiKey)}` +
        `&email=${encodeURIComponent(email)}`;

      const response =
        await fetch(endpoint, {
          cache: 'no-store'
        });

      const data =
        await response.json();

      return NextResponse.json(data);
    }


    /* =====================
       VERIFY
    ===================== */

    if (action === 'verif') {

      if (
        !email ||
        !email.includes('@')
      ) {
        return NextResponse.json({
          status: false,
          error: 'Email tidak valid.'
        });
      }

      if (
        !url ||
        !url.startsWith('http')
      ) {
        return NextResponse.json({
          status: false,
          error:
            'Verification link tidak valid.'
        });
      }

      if (!apiKey) {
        return NextResponse.json({
          status: false,
          error:
            'AM_API_KEY belum dikonfigurasi di Vercel.'
        });
      }

      const endpoint =
        `${API}/api/am` +
        `?action=verif` +
        `&apikey=${encodeURIComponent(apiKey)}` +
        `&email=${encodeURIComponent(email)}` +
        `&url=${encodeURIComponent(url)}`;

      const response =
        await fetch(endpoint, {
          cache: 'no-store'
        });

      const data =
        await response.json();

      return NextResponse.json(data);
    }


    /* =====================
       PREMIUM LOGIN
    ===================== */

    if (action === 'login') {

      if (
        !email ||
        !email.includes('@')
      ) {
        return NextResponse.json({
          status: false,
          error: 'Email tidak valid.'
        });
      }

      if (!key) {
        return NextResponse.json({
          status: false,
          error:
            'AM Premium Key wajib diisi.'
        });
      }


      /*
       * Premium login.
       *
       * Untuk sekarang key dibaca
       * dari environment variable.
       *
       * Contoh:
       *
       * PREMIUM_KEYS=AM-PREM-123,AM-PREM-456
       */

      const rawKeys =
        process.env.PREMIUM_KEYS || '';

      const validKeys =
        rawKeys
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

      if (
        validKeys.length === 0
      ) {
        return NextResponse.json({
          status: false,
          error:
            'Premium key belum dikonfigurasi.'
        });
      }

      if (
        !validKeys.includes(key.trim())
      ) {
        return NextResponse.json({
          status: false,
          error:
            'AM Premium Key tidak valid.'
        });
      }

      return NextResponse.json({
        status: true,
        message:
          'Login berhasil.',
        user: {
          email
        }
      });
    }


    return NextResponse.json({
      status: false,
      error: 'Action tidak dikenal.'
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        status: false,
        error:
          error.message ||
          'Internal server error.'
      },
      {
        status: 500
      }
    );
  }
}
