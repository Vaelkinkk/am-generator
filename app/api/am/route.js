import { NextResponse } from 'next/server';
import crypto from 'crypto';

const API = 'https://restapidhan.vercel.app';

export const runtime = 'nodejs';

/* =========================
   SESSION
========================= */

function getSecret() {
  return (
    process.env.ADMIN_SECRET ||
    process.env.AM_SESSION_SECRET ||
    'CHANGE_THIS_SECRET'
  );
}

function createSession(email, key) {
  const payload = Buffer
    .from(
      JSON.stringify({
        email,
        key,
        createdAt: Date.now(),
      })
    )
    .toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  return `${payload}.${signature}`;
}

function verifySession(token) {
  if (!token) {
    return null;
  }

  const parts = token.split('.');

  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;

  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');

  try {
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected)
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(
      Buffer
        .from(payload, 'base64url')
        .toString()
    );

    const maxAge = 24 * 60 * 60 * 1000;

    if (
      Date.now() - data.createdAt >
      maxAge
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/* =========================
   GITHUB DATABASE
========================= */

async function getDatabase() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch =
    process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    throw new Error(
      'GitHub Environment Variables belum lengkap.'
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/data/db.json?ref=${branch}`,
    {
      cache: 'no-store',
      headers: {
        Accept:
          'application/vnd.github+json',

        Authorization:
          `Bearer ${token}`,

        'X-GitHub-Api-Version':
          '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Gagal membaca database GitHub (${response.status}).`
    );
  }

  const file = await response.json();

  const content = Buffer
    .from(file.content, 'base64')
    .toString('utf8');

  return JSON.parse(content);
}

/* =========================
   FIND KEY
========================= */

async function findPremiumKey(key) {
  const db = await getDatabase();

  if (
    !db ||
    !Array.isArray(db.keys)
  ) {
    return null;
  }

  const found = db.keys.find(
    (item) => item.key === key
  );

  if (!found) {
    return null;
  }

  if (found.active === false) {
    return null;
  }

  if (
    found.expiresAt &&
    Date.now() > Number(found.expiresAt)
  ) {
    return null;
  }

  return found;
}

/* =========================
   AUTH CHECK
========================= */

function requireSession(request) {
  const cookie =
    request.cookies.get('am_session');

  if (!cookie) {
    return null;
  }

  return verifySession(cookie.value);
}

/* =========================
   TELEGRAM
========================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendTelegramNotification({
  email,
  key,
}) {
  const botToken =
    process.env.TELEGRAM_BOT_TOKEN;

  const chatId =
    process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn(
      'Telegram notification belum dikonfigurasi.'
    );

    return;
  }

  const waktu =
    new Date().toLocaleString(
      'id-ID',
      {
        timeZone: 'Asia/Jakarta',
      }
    );

  const text = [
    '🔔 <b>AM PREMIUM BERHASIL</b>',
    '',
    `📧 Email AM: <code>${escapeHtml(
      email
    )}</code>`,
    '',
    `🔑 Premium Key: <code>${escapeHtml(
      key
    )}</code>`,
    '',
    `🕐 Waktu: <code>${escapeHtml(
      waktu
    )}</code>`,
    '',
    '📡 Status: <b>✅ SUCCESS</b>',
  ].join('\n');

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      console.error(
        'Telegram API error:',
        await response.text()
      );
    }
  } catch (error) {
    console.error(
      'Telegram notification error:',
      error
    );
  }
}

/* =========================
   API
========================= */

export async function POST(request) {
  try {
    const body =
      await request.json();

    const {
      action,
      email,
      key,
      url,
    } = body;

    /* =====================
       SESSION
    ===================== */

    if (action === 'session') {
      const session =
        requireSession(request);

      if (!session) {
        return NextResponse.json({
          status: false,
        });
      }

      return NextResponse.json({
        status: true,

        user: {
          email: session.email,
        },
      });
    }

    /* =====================
       LOGIN
    ===================== */

    if (action === 'login') {
      if (
        !email ||
        !email.includes('@')
      ) {
        return NextResponse.json({
          status: false,

          error:
            'Email tidak valid.',
        });
      }

      if (!key) {
        return NextResponse.json({
          status: false,

          error:
            'AM Premium Key wajib diisi.',
        });
      }

      const premiumKey =
        await findPremiumKey(
          key.trim()
        );

      if (!premiumKey) {
        return NextResponse.json({
          status: false,

          error:
            'AM Premium Key tidak valid atau sudah expired.',
        });
      }

      const session =
        createSession(
          email,
          key.trim()
        );

      const response =
        NextResponse.json({
          status: true,

          message:
            'Login berhasil.',
        });

      response.cookies.set(
        'am_session',
        session,
        {
          httpOnly: true,

          secure:
            process.env.NODE_ENV ===
            'production',

          sameSite: 'lax',

          maxAge:
            24 * 60 * 60,

          path: '/',
        }
      );

      return response;
    }

    /* =====================
       LOGOUT
    ===================== */

    if (action === 'logout') {
      const response =
        NextResponse.json({
          status: true,
        });

      response.cookies.set(
        'am_session',
        '',
        {
          httpOnly: true,

          expires:
            new Date(0),

          path: '/',
        }
      );

      return response;
    }

    /* =====================
       REQUIRE LOGIN
    ===================== */

    const session =
      requireSession(request);

    if (!session) {
      return NextResponse.json(
        {
          status: false,

          error:
            'Silakan login terlebih dahulu.',
        },
        {
          status: 401,
        }
      );
    }

    /* =====================
       API KEY
    ===================== */

    const apiKey =
      process.env.AM_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        status: false,

        error:
          'AM_API_KEY belum dikonfigurasi.',
      });
    }

    /* =====================
       SEND
    ===================== */

    if (action === 'send') {
      if (
        !email ||
        !email.includes('@')
      ) {
        return NextResponse.json({
          status: false,

          error:
            'Email tidak valid.',
        });
      }

      const endpoint =
        `${API}/api/am` +
        `?action=send` +
        `&apikey=${encodeURIComponent(
          apiKey
        )}` +
        `&email=${encodeURIComponent(
          email
        )}`;

      const response =
        await fetch(
          endpoint,
          {
            cache: 'no-store',
          }
        );

      const data =
        await response.json();

      /*
       * Notifikasi hanya dikirim
       * ketika API menyatakan sukses.
       */

      if (
        data?.status === true ||
        data?.success === true
      ) {
        await sendTelegramNotification({
          email,
          key: session.key,
        });
      }

      return NextResponse.json(
        data
      );
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

          error:
            'Email tidak valid.',
        });
      }

      if (
        !url ||
        !url.startsWith('http')
      ) {
        return NextResponse.json({
          status: false,

          error:
            'Verification link tidak valid.',
        });
      }

      const endpoint =
        `${API}/api/am` +
        `?action=verif` +
        `&apikey=${encodeURIComponent(
          apiKey
        )}` +
        `&email=${encodeURIComponent(
          email
        )}` +
        `&url=${encodeURIComponent(
          url
        )}`;

      const response =
        await fetch(
          endpoint,
          {
            cache: 'no-store',
          }
        );

      const data =
        await response.json();

      return NextResponse.json(
        data
      );
    }

    /* =====================
       UNKNOWN ACTION
    ===================== */

    return NextResponse.json({
      status: false,

      error:
        'Action tidak dikenal.',
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: false,

        error:
          error.message ||
          'Internal server error.',
      },
      {
        status: 500,
      }
    );
  }
}
