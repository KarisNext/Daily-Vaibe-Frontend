'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SlideArticle {
  news_id: string;
  title: string;
  excerpt: string;
  slug: string;
  image_url: string | null;
  published_at: string;
  reading_time: number;
  views: number;
  likes_count: number;
  first_name: string;
  last_name: string;
  category_name: string;
}

interface HeroSliderProps {
  slides: SlideArticle[];
  onSlideClick: (article: SlideArticle) => void;
  formatDate: (date: string) => string;
  formatNumber: (num: number) => string;
  getImageUrl: (url: string) => string;
}

export default function HeroSlider({ 
  slides, 
  onSlideClick, 
  formatDate, 
  formatNumber, 
  getImageUrl 
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (slides.length > 1) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [slides.length]);

  const startAutoSlide = () => {
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, 5000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 600);
    startAutoSlide();
  };

  const handleSlideClick = (article: SlideArticle) => {
    stopAutoSlide();
    onSlideClick(article);
  };

  const getAuthorName = (article: SlideArticle): string => {
    if (article.first_name || article.last_name) {
      return `${article.first_name || ''} ${article.last_name || ''}`.trim() || 'Anonymous';
    }
    return 'Anonymous';
  };

  if (!slides || slides.length === 0) {
    return (
      <div className="hero-slider-empty">
        <div className="empty-placeholder">No featured stories available</div>
      </div>
    );
  }

  return (
    <div className="hero-slider-container">
      <div className="slider-viewport">
        {slides.map((slide, index) => {
          const imageUrl = getImageUrl(slide.image_url || '');
          const isActive = index === currentIndex;
          
          return (
            <div
              key={`hero-slide-${slide.news_id}-${index}`}
              className={`hero-slide ${isActive ? 'active' : ''} ${isTransitioning ? 'transitioning' : ''}`}
              onClick={() => handleSlideClick(slide)}
            >
              <div className="hero-image-wrapper">
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={slide.title}
                    className="hero-image"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="hero-placeholder">
                    <span className="placeholder-icon">📰</span>
                  </div>
                )}
                <div className="hero-gradient-overlay"></div>
              </div>

              <div className="hero-content-box">
                <div className="hero-category-tag">{slide.category_name}</div>
                <h2 className="hero-title">{slide.title}</h2>
                {slide.excerpt && (
                  <p className="hero-excerpt">{slide.excerpt}</p>
                )}
                <div className="hero-meta-row">
                  <span className="meta-author">{getAuthorName(slide)}</span>
                  <span className="meta-separator">•</span>
                  <span className="meta-date">{formatDate(slide.published_at)}</span>
                  <span className="meta-separator">•</span>
                  <span className="meta-views">👁️ {formatNumber(slide.views)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {slides.length > 1 && (
        <>
          <button 
            className="slider-nav-btn prev-btn" 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button 
            className="slider-nav-btn next-btn" 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="slider-dots">
            {slides.map((_, index) => (
              <button
                key={`dot-${index}`}
                className={`slider-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}