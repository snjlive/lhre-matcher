import type { Metadata } from 'next';
import './style.css';
export const metadata:Metadata={title:'LHRE Matcher',description:'Read-only availability matching for Lighthouse Real Estate',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
