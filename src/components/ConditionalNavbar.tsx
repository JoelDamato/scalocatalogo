'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // No mostrar navbar en las páginas de listas de precios
  if (pathname?.startsWith('/lista-precios/')) {
    return null;
  }
  
  return <Navbar />;
}
