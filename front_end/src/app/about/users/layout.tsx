import { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <header>
            <h1>Header Element</h1>
            <p>Header will remain here, when user is navigating</p>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}