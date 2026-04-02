'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Heart, Menu, X, ChevronDown } from 'lucide-react';
import { useCartStore, useSearchStore } from '@/store';
import styles from './Navbar.module.css';

const navLinks = [
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: 'All Products', href: '/shop', desc: 'Browse the full collection' },
      { label: 'Furniture', href: '/shop/furniture', desc: 'Sofas, beds, tables & more' },
      { label: 'Curtains & Blinds', href: '/shop/curtains', desc: 'Custom window dressings' },
      { label: 'Accessories', href: '/shop/accessories', desc: 'Décor & finishing touches' },
    ],
  },
  {
    label: 'Design Studio',
    href: '/design-studio',
    children: [
      { label: 'Room Visualizer', href: '/design-studio/room-visualizer', desc: 'See furniture in your room' },
      { label: 'Curtain Customizer', href: '/design-studio/curtain-customizer', desc: 'Design your perfect curtains' },
      { label: 'Curtain Calculator', href: '/design-studio/calculator', desc: 'Get exact measurements' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Book Installation', href: '/book-installation' },
  { label: 'About', href: '/about' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { itemCount, toggleCart } = useCartStore();
  const { open: openSearch } = useSearchStore();
  const count = itemCount();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleMouseEnter = (label: string) => setActiveMenu(label);
  const handleMouseLeave = () => setActiveMenu(null);

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.solid : styles.transparent}`}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>Z</span>
            <div className={styles.logoText}>
              <span className={styles.logoName}>ZHUA</span>
              <span className={styles.logoSub}>ENTERPRISES</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <ul className={styles.desktopNav}>
            {navLinks.map((link) => (
              <li
                key={link.label}
                className={styles.navItem}
                onMouseEnter={() => link.children && handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={link.href}
                    className={styles.navLink}
                >
                  {link.label}
                  {link.children && <ChevronDown size={14} />}
                </Link>

                {link.children && activeMenu === link.label && (
                  <div className={styles.megaMenu}>
                    <div className={styles.megaMenuInner}>
                      {link.children.map((child) => (
                        <Link key={child.href} href={child.href} className={styles.megaMenuItem}>
                          <span className={styles.megaMenuLabel}>{child.label}</span>
                          <span className={styles.megaMenuDesc}>{child.desc}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={openSearch} aria-label="Search">
              <Search size={20} />
            </button>
            <Link href="/account/wishlist" className={styles.actionBtn} aria-label="Wishlist">
              <Heart size={20} />
            </Link>
            <button className={styles.cartBtn} onClick={toggleCart} aria-label="Cart">
              <ShoppingBag size={20} />
              {count > 0 && <span className={styles.cartBadge}>{count}</span>}
            </button>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileHeader}>
              <Link href="/" className={styles.logo}>
                <span className={styles.logoIcon}>Z</span>
                <div className={styles.logoText}>
                  <span className={styles.logoName}>ZHUA</span>
                  <span className={styles.logoSub}>ENTERPRISES</span>
                </div>
              </Link>
              <button className={styles.mobileClose} onClick={() => setMobileOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <ul className={styles.mobileLinks}>
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={styles.mobileLink} onClick={() => setMobileOpen(false)}>{link.label}</Link>
                  {link.children && (
                    <ul className={styles.mobileSubLinks}>
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link href={child.href} className={styles.mobileSubLink} onClick={() => setMobileOpen(false)}>
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <div className={styles.mobileFooter}>
              <a href="https://wa.me/27000000000" className="btn btn-whatsapp btn-sm">
                WhatsApp Us
              </a>
              <Link href="/contact" className="btn btn-outline btn-sm" onClick={() => setMobileOpen(false)}>Contact</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
