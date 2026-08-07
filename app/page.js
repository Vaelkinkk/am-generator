'use client';

import { useEffect, useState } from 'react';

export default function Page() {
  const [path, setPath] = useState('/');
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setPath(window.location.pathname);

    checkSession();
  }, []);

  async function checkSession() {
    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'session',
        }),
      });

      const data = await response.json();

      setLoggedIn(Boolean(data.status));
    } catch {
      setLoggedIn(false);
    } finally {
      setChecking(false);
    }
  }

  if (checking) {
    return (
      <main className="page">
        <section className="card loadingCard">
          <div className="brand">AM PREMIUM</div>
          <h1>Loading...</h1>
          <p className="subtitle">
            Memeriksa session kamu.
          </p>
        </section>
      </main>
    );
  }

  if (path === '/login') {
    return <LoginPage />;
  }

  if (!loggedIn) {
    return <LoginRequired />;
  }

  return <ActivatorPage />;
}


/* =========================
   LOGIN REQUIRED
========================= */

function LoginRequired() {
  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          AM PREMIUM
        </div>

        <h1>Login Dulu</h1>

        <p className="subtitle">
          Kamu harus login menggunakan AM Premium
          Key sebelum menggunakan fitur activator.
        </p>

        <a href="/login" className="mainButton">
          Login AM Premium
        </a>

      </section>
    </main>
  );
}


/* =========================
   ACTIVATOR
========================= */

function ActivatorPage() {
  const [email, setEmail] = useState('');
  const [verifyUrl, setVerifyUrl] = useState('');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  async function sendMagicLink() {
    if (!email || !email.includes('@')) {
      setOutput({
        type: 'error',
        text: 'Masukkan email yang valid.',
      });

      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          email,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setOutput({
          type: 'success',
          text:
            'Magic link berhasil dikirim. Silakan cek email dan masukkan verification link.',
        });

        setStep(2);
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Gagal mengirim magic link.',
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyLink() {
    if (
      !verifyUrl ||
      !verifyUrl.startsWith('http')
    ) {
      setOutput({
        type: 'error',
        text: 'Masukkan verification link yang valid.',
      });

      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verif',
          email,
          url: verifyUrl,
        }),
      });

      const data = await response.json();

      if (data.status) {
        setOutput({
          type: 'success',
          title: 'Aktivasi Berhasil',
          text: data.codeorder
            ? `Code Order: ${data.codeorder}`
            : 'Aktivasi berhasil.',
        });

        setStep(3);
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Verifikasi gagal.',
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.',
      });
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setEmail('');
    setVerifyUrl('');
    setOutput(null);
    setStep(1);
  }

  async function logout() {
    await fetch('/api/am', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'logout',
      }),
    });

    window.location.href = '/login';
  }

  return (
    <main className="page">
      <section className="card">

        <div className="topBar">
          <div className="brand">
            AM PREMIUM
          </div>

          <button
            className="logoutButton"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        <h1>AM Activator</h1>

        <p className="subtitle">
          Aktivasi cepat dengan magic link.
        </p>

        <div className="steps">

          <div
            className={
              step >= 1
                ? 'step active'
                : 'step'
            }
          >
            1
          </div>

          <div className="line" />

          <div
            className={
              step >= 2
                ? 'step active'
                : 'step'
            }
          >
            2
          </div>

          <div className="line" />

          <div
            className={
              step >= 3
                ? 'step active'
                : 'step'
            }
          >
            3
          </div>

        </div>


        {/* EMAIL */}

        {step === 1 && (
          <div className="formSection">

            <label>Email</label>

            <input
              type="email"
              placeholder="contoh@gmail.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              disabled={loading}
            />

            <button
              onClick={sendMagicLink}
              disabled={loading}
            >
              {loading
                ? 'Mengirim...'
                : 'Kirim Magic Link'}
            </button>

          </div>
        )}


        {/* VERIFICATION */}

        {step === 2 && (
          <div className="formSection">

            <div className="output info">
              <span>Email</span>
              <strong>{email}</strong>
            </div>

            <label>
              Verification Link
            </label>

            <input
              type="url"
              placeholder="Tempel link dari email..."
              value={verifyUrl}
              onChange={(e) =>
                setVerifyUrl(e.target.value)
              }
              disabled={loading}
            />

            <button
              onClick={verifyLink}
              disabled={loading}
            >
              {loading
                ? 'Memverifikasi...'
                : 'Verifikasi'}
            </button>

            <button
              className="secondary"
              onClick={reset}
              disabled={loading}
            >
              Ganti Email
            </button>

          </div>
        )}


        {/* RESULT */}

        {step === 3 && (
          <div className="result">

            <div className="successIcon">
              ✓
            </div>

            <h2>
              Aktivasi Berhasil
            </h2>

            <p>
              {output?.text}
            </p>

            <button onClick={reset}>
              Aktivasi Lagi
            </button>

          </div>
        )}


        {output && step !== 3 && (
          <div
            className={`output ${output.type}`}
          >
            {output.title && (
              <strong>
                {output.title}
              </strong>
            )}

            <span>
              {output.text}
            </span>
          </div>
        )}

      </section>
    </main>
  );
}


/* =========================
   LOGIN
========================= */

function LoginPage() {
  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState(null);

  async function login() {
    if (!email || !email.includes('@')) {
      setOutput({
        type: 'error',
        text: 'Masukkan email yang valid.',
      });

      return;
    }

    if (!key) {
      setOutput({
        type: 'error',
        text: 'Masukkan AM Premium Key.',
      });

      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          key,
        }),
      });

      const data = await response.json();

      if (data.status) {
        window.location.href = '/';
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            'AM Premium Key tidak valid.',
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card loginCard">

        <div className="brand">
          AM PREMIUM
        </div>

        <h1>Login</h1>

        <p className="subtitle">
          Masuk menggunakan AM Premium Key.
        </p>

        <label>Email</label>

        <input
          type="email"
          placeholder="contoh@gmail.com"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          disabled={loading}
        />

        <label>
          AM Premium Key
        </label>

        <input
          type="text"
          placeholder="AM-PREM-XXXXXXXX"
          value={key}
          onChange={(e) =>
            setKey(e.target.value)
          }
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              login();
            }
          }}
        />

        <button
          onClick={login}
          disabled={loading}
        >
          {loading
            ? 'Memeriksa...'
            : 'Login'}
        </button>

        {output && (
          <div
            className={`output ${output.type}`}
          >
            {output.text}
          </div>
        )}

        <div className="bottom">
          <a href="/">
            ← Kembali
          </a>
        </div>

      </section>
    </main>
  );
}
