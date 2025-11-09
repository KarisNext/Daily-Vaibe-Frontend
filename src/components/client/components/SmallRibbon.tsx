'use client';

import React, { useEffect, useRef, useState } from 'react';
import { formatDate, formatNumber, getImageUrl } from '@/lib/clientData';

interface Article {
  news_id: string;
  title: string;
  slug: string;
  image_url: string | null;
  published_at: string;
  views: number;
  likes_count: number;
  category_name: string;
}

interface SmallRibbonProps {
  articles: Article[];
  onArticleClick: (article: Article) => void;
}

export default function SmallRibbon({ articles, onArticleClick }: SmallRibbonProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number | null>(null);
  const positionRef = useRef(0);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll marquee with seamless loop
  useEffect(() => {
    if (isMobile || articles.length === 0) return;
    
    const track = trackRef.current;
    if (!track) return;

    const SCROLL_SPEED = 1.0; // Smooth decent speed
    const ITEM_WIDTH = 140 + 12; // item width + gap
    const ITEMS_WIDTH = ITEM_WIDTH * articles.length;

    const animate = () => {
      if (!isHovered) {
        positionRef.current += SCROLL_SPEED;
        
        // Seamless loop restart
        if (positionRef.current >= ITEMS_WIDTH) {
          positionRef.current = 0;
        }
        
        track.style.transform = `translateX(-${positionRef.current}px)`;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation after short delay
    const timeout = setTimeout(() => {
      animate();
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [articles.length, isMobile, isHovered]);

  // Scroll left - like Ribbon.tsx
  const scrollLeft = () => {
    const track = trackRef.current;
    if (!track) return;
    
    if (isMobile) {
      track.scrollBy({ left: -300, behavior: 'smooth' });
    } else {
      const SCROLL_AMOUNT = 400;
      const newPosition = Math.max(0, positionRef.current - SCROLL_AMOUNT);
      
      track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      track.style.transform = `translateX(-${newPosition}px)`;
      positionRef.current = newPosition;
      
      setTimeout(() => {
        track.style.transition = 'transform 0.1s linear';
      }, 500);
    }
  };

  // Scroll right - like Ribbon.tsx
  const scrollRight = () => {
    const track = trackRef.current;
    if (!track) return;
    
    if (isMobile) {
      track.scrollBy({ left: 300, behavior: 'smooth' });
    } else {
      const SCROLL_AMOUNT = 400;
      const ITEM_WIDTH = 140 + 12;
      const ITEMS_WIDTH = ITEM_WIDTH * articles.length;
      const newPosition = Math.min(ITEMS_WIDTH, positionRef.current + SCROLL_AMOUNT);
      
      track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      track.style.transform = `translateX(-${newPosition}px)`;
      positionRef.current = newPosition;
      
      setTimeout(() => {
        track.style.transition = 'transform 0.1s linear';
      }, 500);
    }
  };

  if (articles.length === 0) return null;

  // Triple duplication for seamless loop
  const duplicatedArticles = isMobile ? articles : [...articles, ...articles, ...articles];

  return (
    <div 
      className="small-ribbon-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left Navigation Button - Ribbon.tsx style */}
      <button 
        className="ribbon-nav-btn ribbon-nav-left"
        onClick={scrollLeft}
        aria-label="Scroll left"
      >
        ‹
      </button>

      {/* Ribbon Container */}
      <div className="small-ribbon-container">
        <div ref={trackRef} className="ribbon-track">
          {duplicatedArticles.map((article, index) => {
            const imageUrl = getImageUrl(article.image_url || '');
            const uniqueKey = `${article.news_id}-${index}`;
            
            return (
              <div
                key={uniqueKey}
                className="ribbon-item"
                onClick={() => onArticleClick(article)}
              >
                {/* Large image area */}
                <div className="ribbon-item-thumb">
                  {imageUrl ? (
                    <img src={imageUrl} alt={article.title} loading="lazy" />
                  ) : (
                    <div className="ribbon-placeholder">📰</div>
                  )}
                </div>
                
                {/* Compressed text area at bottom */}
                <div className="ribbon-item-content">
                  <span className="ribbon-category">{article.category_name}</span>
                  <div className="ribbon-item-title">{article.title}</div>
                  <div className="ribbon-item-meta">
                    <span className="ribbon-likes">❤️ {formatNumber(article.likes_count)}</span>
                    <span className="ribbon-views">👁 {formatNumber(article.views)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right Navigation Button - Ribbon.tsx style */}
      <button 
        className="ribbon-nav-btn ribbon-nav-right"
        onClick={scrollRight}
        aria-label="Scroll right"
      >
        ›
      </button>
    </div>
  );
}