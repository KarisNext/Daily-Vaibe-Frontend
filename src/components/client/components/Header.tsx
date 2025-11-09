'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFetchNews } from '../hooks/useFetchNews';

interface HeaderProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

interface Stock {
  symbol: string;
  price: number;
  change: number;
  direction: 'up' | 'down';
}

export default function Header({ currentTheme, onThemeChange }: HeaderProps) {
  const router = useRouter();
  const { searchNews, isSearching } = useFetchNews();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const flipContainerRef = useRef<HTMLDivElement>(null);
  const ribbonTrackRef = useRef<HTMLDivElement>(null);
  const desktopTickerRef = useRef<HTMLDivElement>(null);
  const [notificationCount, setNotificationCount] = useState(3);

  const [stockPrices, setStockPrices] = useState<Stock[]>([
    { symbol: 'SCOM', price: 12.45, change: 0.32, direction: 'up' },
    { symbol: 'EQTY', price: 45.80, change: -0.15, direction: 'down' },
    { symbol: 'KCB', price: 38.50, change: 0.75, direction: 'up' },
    { symbol: 'SAFCOM', price: 28.30, change: -0.50, direction: 'down' },
    { symbol: 'COOP', price: 14.20, change: 0.25, direction: 'up' },
    { symbol: 'ABSA', price: 13.95, change: 0.18, direction: 'up' },
    { symbol: 'BAMB', price: 35.40, change: -0.30, direction: 'down' },
    { symbol: 'STCH', price: 19.75, change: 0.42, direction: 'up' },
    { symbol: 'EABL', price: 156.00, change: 1.50, direction: 'up' },
    { symbol: 'NCBA', price: 42.00, change: -0.25, direction: 'down' },
  ]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile ribbon scroll functions
  const scrollRibbonLeft = () => {
    if (ribbonTrackRef.current) {
      ribbonTrackRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRibbonRight = () => {
    if (ribbonTrackRef.current) {
      ribbonTrackRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Desktop ticker scroll functions
  const scrollDesktopLeft = () => {
    if (desktopTickerRef.current) {
      const ticker = desktopTickerRef.current.querySelector('.stock-ticker') as HTMLElement;
      if (ticker) {
        // Pause animation temporarily
        ticker.style.animationPlayState = 'paused';
        const currentTransform = window.getComputedStyle(ticker).transform;
        const matrix = new DOMMatrix(currentTransform);
        const currentX = matrix.m41;
        ticker.style.transform = `translateX(${currentX + 300}px)`;
        
        setTimeout(() => {
          ticker.style.animationPlayState = 'running';
        }, 500);
      }
    }
  };

  const scrollDesktopRight = () => {
    if (desktopTickerRef.current) {
      const ticker = desktopTickerRef.current.querySelector('.stock-ticker') as HTMLElement;
      if (ticker) {
        // Pause animation temporarily
        ticker.style.animationPlayState = 'paused';
        const currentTransform = window.getComputedStyle(ticker).transform;
        const matrix = new DOMMatrix(currentTransform);
        const currentX = matrix.m41;
        ticker.style.transform = `translateX(${currentX - 300}px)`;
        
        setTimeout(() => {
          ticker.style.animationPlayState = 'running';
        }, 500);
      }
    }
  };

  const handleNotificationClick = () => {
    console.log('Notification clicked');
    // Add your notification logic here
    setNotificationCount(0);
  };

  // Mobile 3D flip animation
  useEffect(() => {
    if (!isMobile) return;

    const flipInterval = setInterval(() => {
      setIsFlipping(true);
      
      setTimeout(() => {
        setCurrentPairIndex(prev => (prev + 2) % stockPrices.length);
        setIsFlipping(false);
      }, 400); // Half of the flip animation
    }, 3500); // Flip every 3.5 seconds

    return () => clearInterval(flipInterval);
  }, [isMobile, stockPrices.length]);

  // Update stock prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStockPrices(prev => prev.map(stock => {
        const priceChange = (Math.random() - 0.5) * 0.5;
        const newPrice = stock.price + priceChange;
        const newChange = (Math.random() - 0.5) * 1;
        return {
          ...stock,
          price: Math.max(newPrice, 1),
          change: newChange,
          direction: newChange >= 0 ? 'up' : 'down'
        };
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = await searchNews(searchQuery);
      if (results.length > 0) {
        router.push(`/client/search?q=${encodeURIComponent(searchQuery)}`);
      }
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Get current pair of stocks for mobile display
  const getCurrentStockPair = () => {
    return [
      stockPrices[currentPairIndex % stockPrices.length],
      stockPrices[(currentPairIndex + 1) % stockPrices.length]
    ];
  };

  const getNextStockPair = () => {
    return [
      stockPrices[(currentPairIndex + 2) % stockPrices.length],
      stockPrices[(currentPairIndex + 3) % stockPrices.length]
    ];
  };

  const renderStockItem = (stock: Stock, isMobile: boolean = false) => {
    const classes = isMobile ? 'stock-item-mobile' : 'stock-item';
    const symbolClass = isMobile ? 'stock-symbol-mobile' : 'stock-symbol';
    const priceClass = isMobile ? 'stock-price-mobile' : 'stock-price';
    const changeClass = isMobile ? 'stock-change-mobile' : 'stock-change';

    return (
      <div className={classes}>
        <span className={symbolClass}>{stock.symbol}</span>
        <span className={priceClass}>KSh {stock.price.toFixed(2)}</span>
        <span className={`${changeClass} ${stock.direction}`}>
          {stock.direction === 'up' ? '↑' : '↓'} {Math.abs(stock.change).toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <header className="dynamic-header">
      <div className="header-compact-section">
        <div className="logo-container" onClick={() => router.push('/client')}>
          <div className="logo-text">Daily Vaibe</div>
        </div>

        <div className="stock-ticker-compact">
          {/* Desktop Marquee with Buttons */}
          {!isMobile && (
            <>
              <button 
                className="stock-scroll-btn-desktop"
                onClick={scrollDesktopLeft}
                aria-label="Scroll left"
              >
                ‹
              </button>
              
              <div ref={desktopTickerRef} className="stock-ticker-wrapper">
                <div className="stock-ticker">
                  {[...stockPrices, ...stockPrices].map((stock, index) => (
                    <React.Fragment key={`stock-${index}`}>
                      {renderStockItem(stock, false)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <button 
                className="stock-scroll-btn-desktop"
                onClick={scrollDesktopRight}
                aria-label="Scroll right"
              >
                ›
              </button>
            </>
          )}

          {/* Mobile Scrollable Ribbon */}
          {isMobile && (
            <div className="stock-ribbon-wrapper">
              <button 
                className="stock-scroll-btn"
                onClick={scrollRibbonLeft}
                aria-label="Scroll left"
              >
                ‹
              </button>
              
              <div className="stock-ribbon-container">
                <div ref={ribbonTrackRef} className="stock-ribbon-track">
                  {stockPrices.map((stock, index) => (
                    <React.Fragment key={`mobile-${index}`}>
                      {renderStockItem(stock, true)}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <button 
                className="stock-scroll-btn"
                onClick={scrollRibbonRight}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          )}
        </div>

        <div className="search-inline desktop-only">
          <form onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Search..." 
              className="search-input-inline"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn-inline" disabled={isSearching}>
              🔍
            </button>
          </form>
        </div>

        <div className="header-controls">
          <button 
            className="notification-bell"
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            🔔
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </button>

          <button className="search-trigger mobile-only" onClick={() => setShowSearch(true)}>
            🔍
          </button>

          <div className="theme-dropdown">
            <button 
              className="theme-toggle-btn"
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
            >
              {currentTheme === 'white' ? '☀️' : currentTheme === 'dark' ? '🌙' : '🌍'}
            </button>
            {showThemeDropdown && (
              <div className="theme-dropdown-menu">
                <button 
                  className={`theme-option ${currentTheme === 'white' ? 'active' : ''}`}
                  onClick={() => { onThemeChange('white'); setShowThemeDropdown(false); }}
                >
                  ☀️ Light
                </button>
                <button 
                  className={`theme-option ${currentTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => { onThemeChange('dark'); setShowThemeDropdown(false); }}
                >
                  🌙 Dark
                </button>
                <button 
                  className={`theme-option ${currentTheme === 'african' ? 'active' : ''}`}
                  onClick={() => { onThemeChange('african'); setShowThemeDropdown(false); }}
                >
                  🌍 African
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-box">
            <button className="close-search" onClick={() => setShowSearch(false)}>×</button>
            <form onSubmit={handleSearch}>
              <input 
                type="text" 
                placeholder="Search news, articles, topics..." 
                className="mobile-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="mobile-search-btn" disabled={isSearching}>
                {isSearching ? '⏳' : 'Search'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}