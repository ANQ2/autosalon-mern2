import "./globals.css";
import Providers from "./providers";
import AuthGuard from "./auth-guard";
import Header from "./header";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-neutral-950 text-neutral-100">
        <Providers>
          <AuthGuard>
            <div className="container-page">
              <Header />
              {children}
            </div>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
