import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'CodeLingo - Aprenda a Programar',
  description: 'Aprenda programação no estilo Duolingo.',
  other: {
    'google-adsense-account': 'ca-pub-4464671178971469',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="google-adsense-account" content="ca-pub-4464671178971469" />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
