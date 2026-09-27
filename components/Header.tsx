import Link from 'next/link';
import { Logo } from './Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e4dd]/80 bg-[#f7f5ef]/90 backdrop-blur">
      <div className="container flex h-18 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#63716c] md:flex">
          <Link href="/#why">Why Medora</Link>
          <Link href="/#workflow">How it works</Link>
          <Link href="/#roles">For teams</Link>
          <Link href="/#security">Security</Link>
        </nav>
        <div className="flex gap-2">
          <Link className="btn btn-light" href="/login">Log in</Link>
          <Link className="btn btn-dark" href="/signup">Get started</Link>
        </div>
      </div>
    </header>
  );
}
