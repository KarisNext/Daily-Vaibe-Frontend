'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/components/includes/Session';
import { CategoryManager, getCategoryGroupColor, getCategoryGroupIcon } from './CategoryManager';

interface Category {
  category_id: number;
  name: string;
  slug: string;
}

type MainCategoryKey = 'live-world' | 'counties' | 'politics' | 'business' | 'opinion' | 'sports' | 'lifestyle' | 'entertainment' | 'tech';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  caption: string;
  order: number;
  isFeatured: boolean;
  isUploading: boolean;
}

interface NewsFormData {
  title: string;
  content: string;
  excerpt: string;
  category_ids: number[];
  primary_category_id: string;
  priority: 'high' | 'medium' | 'short';
  featured: boolean;
  tags: string;
  meta_description: string;
  seo_keywords: string;
  youtube_url: string;
  twitter_url: string;
  images: ImageFile[];
}

const CreatePosts: React.FC = () => {
  const { user, csrfToken } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryManager, setCategoryManager] = useState<CategoryManager | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedMainCategory, setSelectedMainCategory] = useState<MainCategoryKey | null>(null);
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    excerpt: '',
    category_ids: [],
    primary_category_id: '',
    priority: 'medium',
    featured: false,
    tags: '',
    meta_description: '',
    seo_keywords: '',
    youtube_url: '',
    twitter_url: '',
    images: []
  });

  useEffect(() => {
    fetchCategories();
    setupPasteListener();
    
    return () => {
      formData.images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setCategoryManager(new CategoryManager(categories, formData.category_ids, selectedMainCategory));
    }
  }, [categories, formData.category_ids, selectedMainCategory]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMainCategoryChange = (mainCategory: MainCategoryKey) => {
    if (!categoryManager) return;

    const result = categoryManager.setMainCategory(mainCategory);
    if (result.success) {
      setSelectedMainCategory(mainCategory);
      setFormData(prev => ({
        ...prev,
        category_ids: [],
        primary_category_id: ''
      }));
    }
  };

  const handleCategoryToggle = (categoryId: number) => {
    if (!categoryManager) return;

    const result = categoryManager.toggleSubCategory(categoryId);

    if (result.success) {
      const primaryCat = categoryManager.getPrimaryCategory();
      setFormData(prev => ({
        ...prev,
        category_ids: result.newSelectedIds,
        primary_category_id: primaryCat ? primaryCat.category_id.toString() : ''
      }));
    } else {
      setMessage({ type: 'error', text: result.message || 'Cannot select this category' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePrimaryCategoryChange = (categoryId: string) => {
    setFormData(prev => {
      const catId = parseInt(categoryId);
      if (!prev.category_ids.includes(catId)) {
        return {
          ...prev,
          category_ids: [...prev.category_ids, catId],
          primary_category_id: categoryId
        };
      }
      return { ...prev, primary_category_id: categoryId };
    });
  };

  const addWatermarkToImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          
          const watermarkSize = Math.min(width, height) * 0.15;
          ctx.font = `bold ${watermarkSize}px Arial`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.rotate(-Math.PI / 6);
          ctx.fillText('KN', 0, 0);
          ctx.restore();
          
          canvas.toBlob((blob) => {
            if (blob) {
              const watermarkedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(watermarkedFile);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          }, file.type, 0.92);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const setupPasteListener = () => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            await addImageFile(file, true);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  };

  const addImageFile = async (file: File, isPasted: boolean = false) => {
    if (formData.images.length >= 10) {
      setMessage({ type: 'error', text: 'Maximum 10 images allowed' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 10MB' });
      return;
    }

    try {
      const watermarkedFile = await addWatermarkToImage(file);
      const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const preview = URL.createObjectURL(watermarkedFile);
      
      const newImage: ImageFile = {
        id,
        file: watermarkedFile,
        preview,
        caption: '',
        order: formData.images.length,
        isFeatured: formData.images.length === 0,
        isUploading: false
      };

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));

      if (isPasted) {
        setMessage({ type: 'success', text: 'Image pasted and watermarked successfully!' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to process image' });
      console.error('Image processing error:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files.slice(0, 10 - formData.images.length)) {
      await addImageFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files.slice(0, 10 - formData.images.length)) {
      await addImageFile(file);
    }
    
    if (pasteZoneRef.current) {
      pasteZoneRef.current.classList.remove('drag-over');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (pasteZoneRef.current) {
      pasteZoneRef.current.classList.add('drag-over');
    }
  };

  const handleDragLeave = () => {
    if (pasteZoneRef.current) {
      pasteZoneRef.current.classList.remove('drag-over');
    }
  };

  const removeImage = (id: string) => {
    setFormData(prev => {
      const image = prev.images.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.preview);
      
      const newImages = prev.images.filter(img => img.id !== id);
      
      if (image?.isFeatured && newImages.length > 0) {
        newImages[0].isFeatured = true;
      }
      
      return { ...prev, images: newImages };
    });
  };

  const setFeaturedImage = (id: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => ({
        ...img,
        isFeatured: img.id === id
      }))
    }));
  };

  const updateImageCaption = (id: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img => 
        img.id === id ? { ...img, caption } : img
      )
    }));
  };

  const wrapText = (tag: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const placeholders: { [key: string]: string } = {
      'QUOTE': 'Your quote here',
      'HIGHLIGHT': 'Important text',
      'BOLD': 'Bold text',
      'ITALIC': 'Italic text',
      'HEADING': 'Heading text'
    };
    
    const wrappedText = `[${tag}]${selectedText || placeholders[tag]}[/${tag}]`;
    
    const newContent = 
      textarea.value.substring(0, start) + 
      wrappedText + 
      textarea.value.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      if (!selectedText) {
        const newStart = start + tag.length + 2;
        const newEnd = newStart + placeholders[tag].length;
        textarea.setSelectionRange(newStart, newEnd);
      } else {
        const newCursorPos = start + wrappedText.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const removeFormatting = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const cleanedText = selectedText
      .replace(/\[(QUOTE|HIGHLIGHT|BOLD|ITALIC|HEADING)\]/g, '')
      .replace(/\[\/(QUOTE|HIGHLIGHT|BOLD|ITALIC|HEADING)\]/g, '');
    
    const newContent = 
      textarea.value.substring(0, start) + 
      cleanedText + 
      textarea.value.substring(end);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + cleanedText.length);
    }, 0);
  };

  const insertLineBreak = () => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const newContent = 
      textarea.value.substring(0, start) + 
      '\n\n' + 
      textarea.value.substring(start);
    
    setFormData(prev => ({ ...prev, content: newContent }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published' = 'draft') => {
    e.preventDefault();
    if (!user) return;

    if (formData.images.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one image' });
      return;
    }

    if (formData.category_ids.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one category' });
      return;
    }

    if (!formData.primary_category_id) {
      setMessage({ type: 'error', text: 'Please select a primary category' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const submitFormData = new FormData();
      
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('excerpt', formData.excerpt);
      submitFormData.append('category_ids', JSON.stringify(formData.category_ids));
      submitFormData.append('primary_category_id', formData.primary_category_id);
      submitFormData.append('priority', formData.priority);
      submitFormData.append('featured', formData.featured.toString());
      submitFormData.append('tags', formData.tags);
      submitFormData.append('meta_description', formData.meta_description);
      submitFormData.append('seo_keywords', formData.seo_keywords);
      submitFormData.append('youtube_url', formData.youtube_url);
      submitFormData.append('twitter_url', formData.twitter_url);
      submitFormData.append('status', status);
      submitFormData.append('author_id', user.admin_id.toString());
      
      formData.images.forEach((img, index) => {
        submitFormData.append('images', img.file);
        submitFormData.append(`image_metadata_${index}`, JSON.stringify({
          caption: img.caption,
          order: img.order,
          is_featured: img.isFeatured
        }));
      });

      const response = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken || ''
        },
        credentials: 'include',
        body: submitFormData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ 
          type: 'success', 
          text: `News ${status} successfully! Article ID: ${result.news?.news_id || 'N/A'}` 
        });
        
        formData.images.forEach(img => URL.revokeObjectURL(img.preview));
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          category_ids: [],
          primary_category_id: '',
          priority: 'medium',
          featured: false,
          tags: '',
          meta_description: '',
          seo_keywords: '',
          youtube_url: '',
          twitter_url: '',
          images: []
        });
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to create news' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPreviewContent = (content: string) => {
    return content.split('\n').map((paragraph, index) => {
      let processedParagraph = paragraph
        .replace(/\[QUOTE\](.*?)\[\/QUOTE\]/g, '<span class="preview-quote">$1</span>')
        .replace(/\[HIGHLIGHT\](.*?)\[\/HIGHLIGHT\]/g, '<span class="preview-highlight">$1</span>')
        .replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<strong>$1</strong>')
        .replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, '<em>$1</em>')
        .replace(/\[HEADING\](.*?)\[\/HEADING\]/g, '<span class="preview-heading">$1</span>');
      
      return (
        <p 
          key={index}
          dangerouslySetInnerHTML={{ __html: processedParagraph }}
        />
      );
    });
  };

  if (isLoading) {
    return (
      <div className="create-posts-loading">
        <div className="loading-spinner"></div>
        <p>Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="create-posts">
      <div className="create-posts-header">
        <h1>Create New Post</h1>
        <div className="header-info">
          <span>Author: {user?.first_name} {user?.last_name}</span>
          <span className="author-id">ID: {user?.admin_id}</span>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="create-form">
        <div className="category-selection-top">
          <div className="category-top-header">
            <h3>📂 Select Main Category (Radio) & Sub-Categories (Checkboxes)</h3>
            <div className="category-top-stats">
              <span className="category-count-badge">
                {formData.category_ids.length} sub-categories
              </span>
              {selectedMainCategory && (
                <span 
                  className="group-badge"
                  style={{ backgroundColor: getCategoryGroupColor(selectedMainCategory) }}
                >
                  {getCategoryGroupIcon(selectedMainCategory)} {selectedMainCategory}
                </span>
              )}
            </div>
          </div>

          <div className="main-categories-radio">
            <h4>1. Select Main Category (Required)</h4>
            <div className="radio-group">
              {categoryManager?.getMainCategories().map(mainCat => (
                <label 
                  key={mainCat} 
                  className={`radio-label ${selectedMainCategory === mainCat ? 'selected' : ''}`}
                  style={{ borderLeftColor: getCategoryGroupColor(mainCat) }}
                >
                  <input
                    type="radio"
                    name="main_category"
                    value={mainCat}
                    checked={selectedMainCategory === mainCat}
                    onChange={() => handleMainCategoryChange(mainCat)}
                  />
                  <span className="radio-icon">{getCategoryGroupIcon(mainCat)}</span>
                  <span className="radio-text">{mainCat}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedMainCategory && (
            <div className="sub-categories-checkboxes">
              <h4>2. Select Sub-Categories (1-4 Required)</h4>
              <p className="helper-text">Select between 1 and 4 sub-categories that best describe your article</p>
              <div className="category-groups-horizontal">
                <div className="category-group-horizontal">
                  <div 
                    className="category-group-header-horizontal"
                    style={{ borderLeftColor: getCategoryGroupColor(selectedMainCategory) }}
                  >
                    <span className="group-icon">{getCategoryGroupIcon(selectedMainCategory)}</span>
                    <span className="group-name">{selectedMainCategory} Sub-Categories</span>
                    <span className="group-count">
                      {formData.category_ids.length}/4 selected
                    </span>
                  </div>
                  <div className="category-checkboxes-horizontal">
                    {categoryManager?.getSubCategoriesForMain(selectedMainCategory).map(category => {
                      const isDisabled = categoryManager?.isSubCategoryDisabled(category.category_id) || false;
                      const isSelected = formData.category_ids.includes(category.category_id);
                      const disabledReason = categoryManager?.getDisabledReason(category.category_id);

                      return (
                        <label 
                          key={category.category_id} 
                          className={`category-checkbox-label-horizontal ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                          title={isDisabled ? disabledReason || '' : ''}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleCategoryToggle(category.category_id)}
                          />
                          <span className="category-checkbox-text">{category.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="form-column-left">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength={200}
                placeholder="Enter post title..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="excerpt">Excerpt</label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                placeholder="Brief summary of the post..."
                maxLength={500}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Main Content</label>
              
              <div className="content-editor-toolbar">
                <div className="toolbar-group">
                  <button type="button" onClick={() => wrapText('BOLD')} className="toolbar-btn" title="Bold Text">
                    <strong>B</strong>
                  </button>
                  <button type="button" onClick={() => wrapText('ITALIC')} className="toolbar-btn" title="Italic Text">
                    <em>I</em>
                  </button>
                  <button type="button" onClick={() => wrapText('HEADING')} className="toolbar-btn" title="Insert Heading">
                    H
                  </button>
                </div>
                
                <div className="toolbar-divider"></div>
                
                <div className="toolbar-group">
                  <button type="button" onClick={() => wrapText('QUOTE')} className="toolbar-btn toolbar-btn-special" title="Insert Large Quote">
                    Quote
                  </button>
                  <button type="button" onClick={() => wrapText('HIGHLIGHT')} className="toolbar-btn toolbar-btn-special" title="Highlight Important Text">
                    Highlight
                  </button>
                </div>
                
                <div className="toolbar-divider"></div>
                
                <div className="toolbar-group">
                  <button type="button" onClick={insertLineBreak} className="toolbar-btn" title="Insert Line Break">
                    Para
                  </button>
                  <button type="button" onClick={removeFormatting} className="toolbar-btn toolbar-btn-remove" title="Remove Formatting from Selection">
                    Clear
                  </button>
                </div>
                
                <div className="toolbar-info">
                  <small>Select text and click buttons to format • Use Clear to remove formatting</small>
                </div>
              </div>

              <textarea
                ref={contentRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={18}
                required
                placeholder="Write your post content here..."
                className="content-editor"
              />
              
              {formData.content && (
                <div className="content-preview">
                  <div className="preview-header">
                    <h4>Live Preview:</h4>
                    <span className="preview-note">This is how your content will appear</span>
                  </div>
                  <div className="preview-content">
                    {renderPreviewContent(formData.content)}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="politics, news, kenya (comma separated)"
              />
            </div>
          </div>

          <div className="form-column-right">
            <div className="form-group">
              <label htmlFor="priority">Priority (Headlines Type)</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="high">High Value (Hot Headlines)</option>
                <option value="medium">Medium</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                />
                <span>Featured Post</span>
              </label>
            </div>

            <div className="form-group">
              <div className="image-upload-section">
                <div className="image-upload-header">
                  <h4>📸 Images ({formData.images.length}/10)</h4>
                  {formData.images.length > 0 && (
                    <span className="image-count-badge">{formData.images.length} uploaded</span>
                  )}
                </div>

                <div 
                  ref={pasteZoneRef}
                  className="paste-zone"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="paste-zone-icon">🖼️</div>
                  <div className="paste-zone-text">Paste, Drop, or Click to Upload</div>
                  <div className="paste-zone-hint">
                    Up to 10 images • Max 10MB each • Auto-watermarked with KN
                  </div>
                  
                  <div className="paste-instructions">
                    <div className="paste-instruction-item">Copy image from browser (Ctrl+C) then paste (Ctrl+V)</div>
                    <div className="paste-instruction-item">Drag and drop images from your computer</div>
                    <div className="paste-instruction-item">Click to browse and select multiple images</div>
                  </div>
                  
                  <button 
                    type="button" 
                    className="upload-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    📁 Browse Files
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*"
                  multiple
                  className="file-input-hidden"
                />

                {formData.images.length > 0 && (
                  <div className="image-preview-grid">
                    {formData.images.map((img) => (
                      <div 
                        key={img.id} 
                        className={`image-preview-item ${img.isFeatured ? 'featured' : ''}`}
                      >
                        {img.isFeatured && <div className="featured-badge">★ Featured</div>}
                        {img.isUploading && <div className="image-loading">Uploading...</div>}
                        
                        <img src={img.preview} alt="Preview" className="image-preview-img" />
                        
                        <div className="image-preview-overlay">
                          <div className="image-preview-actions">
                            {!img.isFeatured && (
                              <button
                                type="button"
                                onClick={() => setFeaturedImage(img.id)}
                                className="image-preview-btn featured-btn"
                                title="Set as featured image"
                              >
                                ★ Featured
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(img.id)}
                              className="image-preview-btn delete-btn"
                              title="Remove image"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Image caption..."
                            value={img.caption}
                            onChange={(e) => updateImageCaption(img.id, e.target.value)}
                            className="image-caption-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="youtube_url">YouTube Video URL</label>
              <input
                type="url"
                id="youtube_url"
                name="youtube_url"
                value={formData.youtube_url}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="twitter_url">Twitter/X Post URL</label>
              <input
                type="url"
                id="twitter_url"
                name="twitter_url"
                value={formData.twitter_url}
                onChange={handleInputChange}
                placeholder="https://twitter.com/user/status/..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="meta_description">Meta Description (SEO)</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleInputChange}
                rows={3}
                maxLength={160}
                placeholder="SEO meta description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="seo_keywords">SEO Keywords</label>
              <input
                type="text"
                id="seo_keywords"
                name="seo_keywords"
                value={formData.seo_keywords}
                onChange={handleInputChange}
                placeholder="kenya news, politics, economy"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={isSubmitting}
            className="btn btn-outline"
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, 'published')}
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Now'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePosts;