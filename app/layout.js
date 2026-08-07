import './style.css';

export const metadata = {
  title: 'AM Premium',
  description: 'AM Premium Activator',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
