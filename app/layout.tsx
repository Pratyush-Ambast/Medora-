import './globals.css'; import type {Metadata} from 'next';
export const metadata:Metadata={title:'Medora — Close the refill gap',description:'Connected prescription refill coordination for pharmacies, providers and patients.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
