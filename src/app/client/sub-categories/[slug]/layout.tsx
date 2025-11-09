import '../../../../styles/SubCategory.css';
import '../../../../styles/Ribbon.css';
import '../../../../styles/Gallery.css';
import '../../../../styles/components_styles/news/Cookies.css';
import '../../../../styles/components_styles/news/Horizontal.css';

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.vybeztribe.com/api/categories/slugs'
      : 'http://localhost:5000/api/categories/slugs';
    
    const response = await fetch(apiUrl, {
      next: { revalidate: 86400 }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }
    
    const categories = await response.json();
    
    return categories.map((category: { slug: string }) => ({
      slug: category.slug,
    }));
  } catch (error) {
    console.error('Failed to fetch category slugs:', error);
    return [
      { slug: 'live' },
      { slug: 'world' },
      { slug: 'nairobi' },
      { slug: 'coast' },
      { slug: 'companies' },
      { slug: 'finance-markets' },
      { slug: 'editorials' },
      { slug: 'columnists' },
      { slug: 'football' },
      { slug: 'athletics' },
      { slug: 'motoring' },
      { slug: 'culture' },
      { slug: 'buzz' },
      { slug: 'trending' },
      { slug: 'innovations' },
      { slug: 'gadgets' },
    ];
  }
}

export default function SubCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}