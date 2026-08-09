import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL??"https://adams-lavage-auto.fr"),title:{default:"Adams Lavage Auto | Nettoyage auto à domicile",template:"%s | Adams Lavage Auto"},description:"Nettoyage automobile intérieur et extérieur, canapés et textiles à domicile à Sarcelles et en Île-de-France.",openGraph:{title:"Adams Lavage Auto",description:"Le detailing professionnel vient à vous.",locale:"fr_FR",type:"website"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}
