'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getImageUrl } from '../../../lib/clientData';

interface RibbonProps {
  news: any[];
  onArticleClick: (article: any) => void;
  title?: string;
}

export default function Ribbon({ news, onArticleClick, title = "Trending Now" }: RibbonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (ribbonRef.current) {
      observer.observe(ribbonRef.current);
    }

    return () => {
      if (ribbonRef.current) {
        observer.unobserve(ribbonRef.current);
      }
    };
  }, [isVisible]);

  const getExcerpt = (article: any) => {
    if (article.excerpt) return article.excerpt;
    if (article.content) {
      const plainText = article.content.replace(/<[^>]+>/g, '').trim();
      return plainText.substring(0, 100) + (plainText.length > 100 ? '...' : '');
    }
    return '';
  };

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="news-ribbon" ref={ribbonRef}>
      <div className="ribbon-container">
        {title && <h3 className="ribbon-title">{title}</h3>}
        <div className="ribbon-wrapper">
          <button className="ribbon-nav-btn ribbon-nav-left" onClick={scrollLeft} aria-label="Scroll left">
            ‹
          </button>
          <button className="ribbon-nav-btn ribbon-nav-right" onClick={scrollRight} aria-label="Scroll right">
            ›
          </button>
          <div className={`ribbon-track ${isVisible ? 'animate' : ''}`} ref={trackRef}>
            {news.map((article: any, index: number) => (
              <div
                key={`${article.news_id}-${index}`}
                className="ribbon-item"
                onClick={() => onArticleClick(article)}
              >
                <div className="ribbon-image-container">
                  {article.image_url ? (
                    <img 
                      src={getImageUrl(article.image_url) || ''} 
                      alt={article.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="ribbon-placeholder">📰</div>
                  )}
                  <div className="ribbon-content-overlay">
                    <h4 className="ribbon-title-text">{article.title}</h4>
                    <p className="ribbon-excerpt">{getExcerpt(article)}</p>
                  </div>
                </div>
              </div>
            ))}
            {news.map((article: any, index: number) => (
              <div
                key={`${article.news_id}-duplicate-${index}`}
                className="ribbon-item"
                onClick={() => onArticleClick(article)}
              >
                <div className="ribbon-image-container">
                  {article.image_url ? (
                    <img 
                      src={getImageUrl(article.image_url) || ''} 
                      alt={article.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="ribbon-placeholder">📰</div>
                  )}
                  <div className="ribbon-content-overlay">
                    <h4 className="ribbon-title-text">{article.title}</h4>
                    <p className="ribbon-excerpt">{getExcerpt(article)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}