import "./globals.css";
import { RQProvider } from "@/lib/queryClient";

export const metadata = { title: "Temple Booking" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RQProvider>{children}</RQProvider>
      </body>
    </html>
  );
}
