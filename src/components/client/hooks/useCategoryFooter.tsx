'use client';

import { useState, useEffect, useCallback } from 'react';

export interface FooterCategory {
  category_id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  order_index: number;
  active: boolean;
}

export interface CategoryGroup {
  title: string;
  icon: string;
  description?: string;
  mainSlug?: string;
  categories: FooterCategory[];
}

interface GroupedResponse {
  success: boolean;
  groups: {
    'live-world': CategoryGroup;
    'counties': CategoryGroup;
    'business': CategoryGroup;
    'opinion': CategoryGroup;
    'sports': CategoryGroup;
    'lifestyle': CategoryGroup;
    'entertainment': CategoryGroup;
    'tech': CategoryGroup;
  };
  total_categories: number;
}

interface UseCategoryFooterReturn {
  categories: FooterCategory[];
  groups: CategoryGroup[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCategories: number;
}

export const useCategoryFooter = (): UseCategoryFooterReturn => {
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCategories, setTotalCategories] = useState(0);

  const transformGroupsToArray = useCallback((groupedData: GroupedResponse['groups']): CategoryGroup[] => {
    return Object.values(groupedData).filter(group => group.categories.length > 0);
  }, []);

  const extractAllCategories = useCallback((groupedData: GroupedResponse['groups']): FooterCategory[] => {
    return Object.values(groupedData).flatMap(group => group.categories);
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/client/footer-categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GroupedResponse = await response.json();

      if (data.success && data.groups) {
        const groupsArray = transformGroupsToArray(data.groups);
        const allCategories = extractAllCategories(data.groups);
        
        setGroups(groupsArray);
        setCategories(allCategories);
        setTotalCategories(data.total_categories);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(message);
      setCategories([]);
      setGroups([]);
      setTotalCategories(0);
    } finally {
      setIsLoading(false);
    }
  }, [transformGroupsToArray, extractAllCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    groups,
    isLoading,
    error,
    refetch: fetchCategories,
    totalCategories
  };
};