import type { Metadata } from 'next';
import './globals.css';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export const metadata: Metadata = {
  title: 'SpaceSustain — The Future of Cities, Before They’re Built',
  description: 'A cinematic sustainability intelligence twin of Dubai. Explore real geography, district flights, and transparent planning scenarios.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
