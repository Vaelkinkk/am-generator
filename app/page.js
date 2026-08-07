'use client';

import { useState } from 'react';
import './style.css';

export default function Home() {
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    if (!email || !email.includes('@')) {
      setStatus({
        type: 'error',
        text: 'Masukkan email yang valid.'
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(
        '/api/am?action=send&email=' +
        encodeURIComponent(email)
      );

      const data = await response.json();

      if (data.status) {
        setStatus({
          type: 'success',
          text:
            `Magic link dikirim ke ${email}. ` +
            `Cek email kamu, lalu tempel URL di bawah.`
        });
      } else {
        setStatus({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Gagal mengirim magic link.'
        });
      }
    } catch {
      setStatus({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.'
      });
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!email || !url || !url.startsWith('http')) {
      setStatus({
        type: 'error',
        text: 'Email dan URL verifikasi harus diisi dengan benar.'
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(
        '/api/am?action=verif' +
        '&email=' + encodeURIComponent(email) +
        '&url=' + encodeURIComponent(url)
      );

      const data = await response.json();

      if (data.status) {
        setStatus({
          type: 'success',
          text:
            `Berhasil diaktifkan! Code Order: ` +
            `${data.codeorder || '-'}`
        });

        setUrl('');
      } else {
        setStatus({
          type: 'error',
          text:
            data.error ||
            data.message ||
            'Verifikasi gagal.'
        });
      }
    } catch {
      setStatus({
        type: 'error',
        text: 'Terjadi kesalahan koneksi.'
      });
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    setUrl('');

    setStatus({
      type: 'info',
      text: 'Proses di halaman ini dibatalkan.'
    });
  }

  return (
    <main className="page">
      <section className="card">

        <div className="badge">
          AM ACTIVATOR
        </div>

        <h1>Aktivasi AM</h1>

        <p className="sub">
          Kirim magic link, lalu verifikasi URL dari email.
        </p>

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
            ? 'Memproses...'
            : 'Kirim Magic Link'}
        </button>

        <div className="divider" />

        <label>URL Verifikasi</label>

        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
        />

        <button
          onClick={verify}
          disabled={loading}
        >
          {loading
            ? 'Memproses...'
            : 'Verifikasi & Aktivasi'}
        </button>

        <button
          className="secondary"
          onClick={cancel}
          disabled={loading}
        >
          Batalkan
        </button>

        {status && (
          <div className={`status ${status.type}`}>
            {status.text}
          </div>
        )}

        <p className="hint">
          API key disimpan di server dan tidak dikirim ke browser.
        </p>

      </section>
    </main>
  );
}
