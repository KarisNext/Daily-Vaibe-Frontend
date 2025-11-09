// frontend/src/components/client/hooks/useSlider.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SliderItem {
  news_id: string | number;
  title: string;
  slug: string;
  [key: string]: any;
}

interface UseSliderProps {
  items: SliderItem[];
  autoPlayInterval?: number;
  transitionDuration?: number;
}

interface UseSliderReturn {
  currentIndex: number;
  currentSlide: SliderItem | null;
  isTransitioning: boolean;
  nextSlide: () => void;
  prevSlide: () => void;
  goToSlide: (index: number) => void;
  pauseAutoPlay: () => void;
  resumeAutoPlay: () => void;
  progress: number;
}

export const useSlider = ({
  items,
  autoPlayInterval = 5000,
  transitionDuration = 800
}: UseSliderProps): UseSliderReturn => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentSlide = items.length > 0 ? items[currentIndex] : null;

  const clearTimers = useCallback(() => {
    if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    if (progressRef.current) clearTimeout(progressRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  const startProgress = useCallback(() => {
    setProgress(0);
    clearTimers();

    const increment = 100 / (autoPlayInterval / 50);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, 50);
  }, [autoPlayInterval, clearTimers]);

  const nextSlide = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev + 1) % items.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, transitionDuration]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || items.length === 0) return;
    
    setIsTransitioning(true);
    setCurrentIndex(prev => (prev - 1 + items.length) % items.length);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, transitionDuration]);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning || items.length === 0 || index === currentIndex) return;
    
    setIsTransitioning(true);
    setCurrentIndex(index);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [items.length, isTransitioning, currentIndex, transitionDuration]);

  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    clearTimers();
  }, [clearTimers]);

  const resumeAutoPlay = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    if (items.length <= 1 || isPaused) {
      clearTimers();
      return;
    }

    startProgress();

    autoPlayRef.current = setTimeout(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => clearTimers();
  }, [currentIndex, items.length, isPaused, autoPlayInterval, nextSlide, startProgress, clearTimers]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, prevSlide]);

  return {
    currentIndex,
    currentSlide,
    isTransitioning,
    nextSlide,
    prevSlide,
    goToSlide,
    pauseAutoPlay,
    resumeAutoPlay,
    progress
  };
};