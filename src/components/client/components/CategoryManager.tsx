interface Category {
  category_id: number;
  name: string;
  slug: string;
}

type MainCategoryKey = 'live-world' | 'counties' | 'politics' | 'business' | 'opinion' | 'sports' | 'lifestyle' | 'entertainment' | 'tech';

const MAIN_CATEGORY_MAPPING: Record<MainCategoryKey, string[]> = {
  'live-world': ['live', 'world', 'gender'],
  'counties': ['nairobi', 'coast', 'mountain', 'lake-region', 'rift-valley', 'northern'],
  'politics': ['politics', 'live-news', 'national-news', 'world-news', 'international', 'legal'],
  'business': ['companies', 'finance-markets', 'seeds-of-gold', 'enterprise'],
  'opinion': ['editorials', 'columnists', 'guest-blogs', 'letters', 'cutting-edge', 'cartoons'],
  'sports': ['football', 'athletics', 'rugby', 'motorsport', 'talkup', 'other-sports'],
  'lifestyle': ['motoring', 'culture', 'family', 'relationships', 'art-books', 'travel', 'wellness'],
  'entertainment': ['buzz', 'trending', 'gossip', 'life-stories', 'more-entertainment'],
  'tech': ['innovations', 'gadgets', 'startups', 'digital-life']
};

const CATEGORY_GROUP_COLORS: Record<MainCategoryKey, string> = {
  'live-world': '#e74c3c',
  'counties': '#3498db',
  'politics': '#c0392b',
  'business': '#2ecc71',
  'opinion': '#f39c12',
  'sports': '#9b59b6',
  'lifestyle': '#1abc9c',
  'entertainment': '#e91e63',
  'tech': '#34495e'
};

const CATEGORY_GROUP_ICONS: Record<MainCategoryKey, string> = {
  'live-world': '🌍',
  'counties': '🏢',
  'politics': '🏛️',
  'business': '💼',
  'opinion': '💭',
  'sports': '⚽',
  'lifestyle': '🎭',
  'entertainment': '🎉',
  'tech': '💻'
};

export const getCategoryGroupColor = (groupKey: string): string => {
  return CATEGORY_GROUP_COLORS[groupKey as MainCategoryKey] || '#95a5a6';
};

export const getCategoryGroupIcon = (groupKey: string): string => {
  return CATEGORY_GROUP_ICONS[groupKey as MainCategoryKey] || '📰';
};

export class CategoryManager {
  private allCategories: Category[];
  private selectedCategoryIds: number[];
  private mainCategory: MainCategoryKey | null;
  
  constructor(
    categories: Category[],
    selectedIds: number[] = [],
    mainCategory: MainCategoryKey | null = null
  ) {
    this.allCategories = categories;
    this.selectedCategoryIds = selectedIds;
    this.mainCategory = mainCategory;
  }

  getMainCategories(): MainCategoryKey[] {
    return Object.keys(MAIN_CATEGORY_MAPPING) as MainCategoryKey[];
  }

  setMainCategory(mainCategory: string): { success: boolean; message?: string } {
    if (!this.getMainCategories().includes(mainCategory as MainCategoryKey)) {
      return { success: false, message: 'Invalid main category' };
    }
    
    this.mainCategory = mainCategory as MainCategoryKey;
    this.selectedCategoryIds = [];
    
    return { success: true };
  }

  getSubCategoriesForMain(mainCategory: string): Category[] {
    const allowedSlugs = MAIN_CATEGORY_MAPPING[mainCategory as MainCategoryKey] || [];
    return this.allCategories.filter(cat => allowedSlugs.includes(cat.slug));
  }

  getAllCategoriesForMain(mainCategory: string): Category[] {
    return this.getSubCategoriesForMain(mainCategory);
  }

  getAllSubCategories(): Category[] {
    if (!this.mainCategory) return [];
    return this.getSubCategoriesForMain(this.mainCategory);
  }

  toggleSubCategory(categoryId: number): { success: boolean; message?: string; newSelectedIds: number[] } {
    const category = this.allCategories.find(c => c.category_id === categoryId);
    
    if (!category) {
      return { success: false, message: 'Category not found', newSelectedIds: this.selectedCategoryIds };
    }

    if (!this.mainCategory) {
      return { success: false, message: 'Please select a main category first', newSelectedIds: this.selectedCategoryIds };
    }

    const allowedCategories = this.getSubCategoriesForMain(this.mainCategory);
    const isAllowed = allowedCategories.some(c => c.category_id === categoryId);
    
    if (!isAllowed) {
      return { 
        success: false, 
        message: `This category is not part of ${this.mainCategory}`, 
        newSelectedIds: this.selectedCategoryIds 
      };
    }

    const isCurrentlySelected = this.selectedCategoryIds.includes(categoryId);
    
    if (isCurrentlySelected) {
      const newIds = this.selectedCategoryIds.filter(id => id !== categoryId);
      this.selectedCategoryIds = newIds;
      return { success: true, newSelectedIds: newIds };
    } else {
      if (this.selectedCategoryIds.length >= 4) {
        return { 
          success: false, 
          message: 'Maximum 4 sub-categories allowed', 
          newSelectedIds: this.selectedCategoryIds 
        };
      }
      
      const newIds = [...this.selectedCategoryIds, categoryId];
      this.selectedCategoryIds = newIds;
      return { success: true, newSelectedIds: newIds };
    }
  }

  isSubCategoryDisabled(categoryId: number): boolean {
    if (!this.mainCategory) return true;
    
    const category = this.allCategories.find(c => c.category_id === categoryId);
    if (!category) return true;

    const allowedCategories = this.getSubCategoriesForMain(this.mainCategory);
    const isAllowed = allowedCategories.some(c => c.category_id === categoryId);
    
    if (!isAllowed) return true;
    
    const isSelected = this.selectedCategoryIds.includes(categoryId);
    if (isSelected) return false;
    
    return this.selectedCategoryIds.length >= 4;
  }

  getDisabledReason(categoryId: number): string {
    if (!this.mainCategory) return 'Select a main category first';
    
    const category = this.allCategories.find(c => c.category_id === categoryId);
    if (!category) return 'Category not found';

    const allowedCategories = this.getSubCategoriesForMain(this.mainCategory);
    const isAllowed = allowedCategories.some(c => c.category_id === categoryId);
    
    if (!isAllowed) {
      return `Not part of ${this.mainCategory}`;
    }
    
    if (this.selectedCategoryIds.length >= 4 && !this.selectedCategoryIds.includes(categoryId)) {
      return 'Maximum 4 categories reached';
    }
    
    return '';
  }

  getPrimaryCategory(): Category | null {
    if (this.selectedCategoryIds.length === 0) return null;
    return this.allCategories.find(c => c.category_id === this.selectedCategoryIds[0]) || null;
  }

  getSelectedCategories(): Category[] {
    return this.allCategories.filter(c => this.selectedCategoryIds.includes(c.category_id));
  }
}