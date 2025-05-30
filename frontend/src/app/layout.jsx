import "./globals.css";


export const metadata = {
  title: "FaithSeeker",
  description: "A platform for faith seekers and churches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      
      <body className="antialiased font-roboto">
        
        {children}
      </body>
    </html>
  );
}