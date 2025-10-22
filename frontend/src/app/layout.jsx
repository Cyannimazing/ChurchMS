import { Roboto } from "next/font/google";
import "./globals.css";

// Configure Roboto font
const robotoFont = Roboto({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

const RootLayout = ({ children }) => {
  return (
    <html lang="en" className={robotoFont.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
};

export const metadata = {
  title: "FaithSeeker",
};

export default RootLayout;
