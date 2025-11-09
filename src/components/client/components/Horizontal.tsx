'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface HorizontalProps {
  activeCategory?: string;
}

const MAIN_CATEGORIES = [
  { slug: 'home', name: 'Home', icon: '🏠', isGroup: false },
  { slug: 'live-world', name: 'Live & World', icon: '🌍', isGroup: true },
  { slug: 'counties', name: 'Counties', icon: '🏢', isGroup: true },
  { slug: 'politics', name: 'Politics', icon: '🏛️', isGroup: true },
  { slug: 'business', name: 'Business', icon: '💼', isGroup: true },
  { slug: 'opinion', name: 'Opinion', icon: '💭', isGroup: true },
  { slug: 'sports', name: 'Sports', icon: '⚽', isGroup: true },
  { slug: 'lifestyle', name: 'Life & Style', icon: '🎭', isGroup: true },
  { slug: 'entertainment', name: 'Entertainment', icon: '🎉', isGroup: true },
  { slug: 'tech', name: 'Technology', icon: '💻', isGroup: true }
];

export default function Horizontal({ activeCategory }: HorizontalProps) {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleCategoryClick = (categorySlug: string, isGroup: boolean) => {
    if (categorySlug === 'home') {
      router.push('/client');
    } else if (isGroup) {
      router.push(`/client/categories/${categorySlug}`);
    } else {
      router.push(`/client/sub-categories/${categorySlug}`);
    }
    setShowMobileMenu(false);
  };

  return (
    <>
      <nav className="category-navigation desktop-only">
        <div className="main-container">
          <div className="nav-categories">
            {MAIN_CATEGORIES.map(cat => (
              <button 
                key={cat.slug}
                className={`nav-category ${activeCategory === cat.slug ? 'active' : ''}`} 
                onClick={() => handleCategoryClick(cat.slug, cat.isGroup)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <button 
        className="horizontal-hamburger mobile-only" 
        onClick={() => setShowMobileMenu(true)}
        title="Categories Menu"
      >
        ☰
      </button>

      {showMobileMenu && (
        <>
          <div className="mobile-sidebar-overlay active" onClick={() => setShowMobileMenu(false)} />
          <div className="mobile-sidebar-drawer right">
            <button className="mobile-sidebar-close" onClick={() => setShowMobileMenu(false)}>×</button>
            <h3 className="sidebar-title">Categories</h3>
            <div className="horizontal-mobile-list">
              {MAIN_CATEGORIES.map(cat => (
                <button 
                  key={cat.slug}
                  className={`horizontal-mobile-item ${activeCategory === cat.slug ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat.slug, cat.isGroup)}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

    </>
  );
}