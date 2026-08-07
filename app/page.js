'use client';

import { useEffect, useState } from 'react';
import './style.css';

export default function Page() {
  const [path, setPath] = useState('/');

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  if (path === '/login') {
    return <LoginPage />;
  }

  return <ActivatorPage />;
}

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
        text: 'Masukkan email yang valid.'
      });
      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send',
          email
        })
      });

      const data = await response.json();

      if (data.status) {
        setOutput({
          type: 'success',
          text:
            'Magic link berhasil dikirim. Silakan cek email kamu dan masukkan verification link di bawah.'
        });

        setStep(2);
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Gagal mengirim magic link.'
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function verifyLink() {
    if (!verifyUrl || !verifyUrl.startsWith('http')) {
      setOutput({
        type: 'error',
        text: 'Masukkan verification link yang valid.'
      });
      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'verif',
          email,
          url: verifyUrl
        })
      });

      const data = await response.json();

      if (data.status) {
        setOutput({
          type: 'success',
          title: 'Aktivasi Berhasil',
          text: data.codeorder
            ? `Code Order: ${data.codeorder}`
            : 'Aktivasi berhasil.'
        });

        setStep(3);
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Verifikasi gagal.'
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.'
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

  return (
    <main className="page">
      <section className="card">

        <div className="brand">
          AM PREMIUM
        </div>

        <h1>AM Activator</h1>

        <p className="subtitle">
          Aktivasi cepat dengan magic link.
        </p>

        <div className="steps">
          <div className={step >= 1 ? 'step active' : 'step'}>
            1
          </div>

          <div className="line" />

          <div className={step >= 2 ? 'step active' : 'step'}>
            2
          </div>

          <div className="line" />

          <div className={step >= 3 ? 'step active' : 'step'}>
            3
          </div>
        </div>

        {step === 1 && (
          <div className="formSection">

            <label>Email</label>

            <input
              type="email"
              placeholder="contoh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

        {step === 2 && (
          <div className="formSection">

            <div className="output info">
              <span>Email</span>
              <strong>{email}</strong>
            </div>

            <label>Verification Link</label>

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
          <div className={`output ${output.type}`}>
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

        <div className="bottom">
          <a href="/login">
            Login AM Premium
          </a>
        </div>

      </section>
    </main>
  );
}


/* =========================
   LOGIN PAGE
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
        text: 'Masukkan email yang valid.'
      });
      return;
    }

    if (!key) {
      setOutput({
        type: 'error',
        text: 'Masukkan AM Premium Key.'
      });
      return;
    }

    setLoading(true);
    setOutput(null);

    try {
      const response = await fetch('/api/am', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'login',
          email,
          key
        })
      });

      const data = await response.json();

      if (data.status) {
        localStorage.setItem(
          'am_premium',
          JSON.stringify(data.user || {
            email
          })
        );

        setOutput({
          type: 'success',
          text: 'Login berhasil. AM Premium aktif.'
        });
      } else {
        setOutput({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Key tidak valid.'
        });
      }
    } catch {
      setOutput({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.'
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

          <label>AM Premium Key</label>

          <input
            type="text"
            placeholder="AM-PREM-XXXXXXXX"
            value={key}
            onChange={(e) =>
              setKey(e.target.value)
            }
            disabled={loading}
          />

          <button
            onClick={login}
            disabled={loading}
          >
            {loading
              ? 'Memeriksa...'
              : 'Login'}
          </button>

        </div>

        {output && (
          <div className={`output ${output.type}`}>
            {output.text}
          </div>
        )}

        <div className="bottom">
          <a href="/">
            ← Kembali ke Activator
          </a>
        </div>

      </section>
    </main>
  );
}
