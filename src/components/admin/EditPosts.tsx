// File: frontend/src/components/admin/EditPosts.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/components/includes/Session';
import { useRouter } from 'next/navigation';

interface Category {
  category_id: number;
  name: string;
  slug: string;
  parent?: string;
}

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
  category_id: string;
  priority: 'high' | 'medium' | 'short';
  featured: boolean;
  tags: string;
  meta_description: string;
  seo_keywords: string;
  youtube_url: string;
  images: ImageFile[];
  existingImages?: any[];
}

interface PostData {
  title: string;
  content: string;
  excerpt: string;
  category_id: number;
  priority: 'high' | 'medium' | 'short';
  featured: boolean;
  tags: string;
  meta_description: string;
  seo_keywords: string;
  youtube_url: string;
  image_url: string | null;
  images?: any[];
}

interface ApiResponse {
  news: PostData;
}

interface CategoriesResponse {
  categories: Category[];
}

interface EditPostsProps {
  newsId: number;
  onBack?: () => void;
}

const EditPosts: React.FC<EditPostsProps> = ({ newsId, onBack }) => {
  const { user, csrfToken } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const pasteZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    excerpt: '',
    category_id: '',
    priority: 'medium',
    featured: false,
    tags: '',
    meta_description: '',
    seo_keywords: '',
    youtube_url: '',
    images: [],
    existingImages: []
  });

  // API Base URL configuration
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://vybeztribe.com'
    : 'http://localhost:5000';

  // Fetch initial post data and categories
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      if (!user || !csrfToken) {
        router.push('/auth/login');
        return;
      }
      setIsLoading(true);
      try {
        const [postData, categoriesData] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/edit?id=${newsId}`, {
            headers: {
              'X-CSRF-Token': csrfToken || '',
            },
            credentials: 'include',
          }).then(res => res.json()),
          fetch(`${API_BASE_URL}/api/admin/categories`, {
            credentials: 'include',
          }).then(res => res.json()),
        ]);

        const post = postData.news;
        if (!post) {
          throw new Error('Post not found');
        }

        // Process existing images if available
        const existingImages = post.images || [];
        const imageFiles: ImageFile[] = [];

        const formattedData: NewsFormData = {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          category_id: post.category_id.toString(),
          priority: post.priority,
          featured: post.featured,
          tags: post.tags,
          meta_description: post.meta_description,
          seo_keywords: post.seo_keywords,
          youtube_url: post.youtube_url,
          images: imageFiles,
          existingImages: existingImages
        };

        setFormData(formattedData);
        setCategories(categoriesData.categories || []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: 'Failed to load post data.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [newsId, user, csrfToken, router]);

  // Group categories by parent for organized display
  const groupedCategories = () => {
    const groups: { [key: string]: Category[] } = {};
    categories.forEach(cat => {
      const parent = cat.parent || 'Other';
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(cat);
    });
    return groups;
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

  // ===== IMAGE HANDLING FUNCTIONS =====
  
  const setupPasteListener = () => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            addImageFile(file, true);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  };

  useEffect(() => {
    setupPasteListener();
    
    return () => {
      // Cleanup image previews
      formData.images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  const addImageFile = (file: File, isPasted: boolean = false) => {
    if (formData.images.length >= 5) {
      setMessage({ type: 'error', text: 'Maximum 5 images allowed' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const preview = URL.createObjectURL(file);
    
    const newImage: ImageFile = {
      id,
      file,
      preview,
      caption: '',
      order: formData.images.length,
      isFeatured: formData.images.length === 0 && (!formData.existingImages || formData.existingImages.length === 0),
      isUploading: false
    };

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, newImage]
    }));

    if (isPasted) {
      setMessage({ type: 'success', text: 'Image pasted successfully!' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.slice(0, 5 - formData.images.length).forEach(file => addImageFile(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    files.slice(0, 5 - formData.images.length).forEach(file => addImageFile(file));
    
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
      
      // If we removed the featured image, make the first remaining image featured
      if (image?.isFeatured && newImages.length > 0) {
        newImages[0].isFeatured = true;
      }
      
      return { ...prev, images: newImages };
    });
  };

  const removeExistingImage = (imageId: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages?.filter(img => img.image_id !== imageId) || []
    }));
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

  const setExistingFeaturedImage = (imageId: number) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages?.map(img => ({
        ...img,
        is_featured: img.image_id === imageId
      })) || []
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

  const updateExistingImageCaption = (imageId: number, caption: string) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages?.map(img => 
        img.image_id === imageId ? { ...img, caption } : img
      ) || []
    }));
  };

  // ===== CONTENT FORMATTING FUNCTIONS =====
  
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

  // ===== FORM SUBMISSION =====
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const submitFormData = new FormData();
      
      // Add text fields
      submitFormData.append('news_id', newsId.toString());
      submitFormData.append('title', formData.title);
      submitFormData.append('content', formData.content);
      submitFormData.append('excerpt', formData.excerpt);
      submitFormData.append('category_id', formData.category_id);
      submitFormData.append('priority', formData.priority);
      submitFormData.append('featured', formData.featured.toString());
      submitFormData.append('tags', formData.tags);
      submitFormData.append('meta_description', formData.meta_description);
      submitFormData.append('seo_keywords', formData.seo_keywords);
      submitFormData.append('youtube_url', formData.youtube_url);
      submitFormData.append('author_id', user.admin_id.toString());
      
      // Add new images with metadata
      formData.images.forEach((img, index) => {
        submitFormData.append('new_images', img.file);
        submitFormData.append(`new_image_metadata_${index}`, JSON.stringify({
          caption: img.caption,
          order: img.order,
          is_featured: img.isFeatured
        }));
      });

      // Add existing images metadata
      if (formData.existingImages && formData.existingImages.length > 0) {
        submitFormData.append('existing_images', JSON.stringify(formData.existingImages));
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/edit`, {
        method: 'PUT',
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
          text: `Post updated successfully!` 
        });
        
        // Navigate back after success
        setTimeout(() => {
          if (onBack) {
            onBack();
          } else {
            router.back();
          }
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message || 'Failed to update post' });
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

  // Handle back navigation
  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <div className="create-posts-loading">
        <div className="loading-spinner"></div>
        <p>Loading post data...</p>
      </div>
    );
  }

  const categoryGroups = groupedCategories();
  const totalImages = (formData.existingImages?.length || 0) + formData.images.length;

  return (
    <div className="create-posts edit-posts">
      <div className="create-posts-header">
        <h1>Edit Post</h1>
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

      <form onSubmit={handleSubmit} className="create-form">
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
              <label htmlFor="category_id">Category *</label>
              <div className="category-select-wrapper">
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="category-select"
                >
                  <option value="">Select Category</option>
                  {Object.entries(categoryGroups).map(([parent, cats]) => (
                    <optgroup key={parent} label={parent}>
                      {cats.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <small className="category-help-text">
                  Choose the most appropriate category for your article
                </small>
              </div>
            </div>

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

            {/* ENHANCED IMAGE UPLOAD SECTION */}
            <div className="form-group">
              <div className="image-upload-section">
                <div className="image-upload-header">
                  <h4>📸 Images ({totalImages}/5)</h4>
                  {totalImages > 0 && (
                    <span className="image-count-badge">{totalImages} images</span>
                  )}
                </div>

                {/* Existing Images */}
                {formData.existingImages && formData.existingImages.length > 0 && (
                  <div className="existing-images-section">
                    <h5>Existing Images</h5>
                    <div className="image-preview-grid">
                      {formData.existingImages.map((img) => (
                        <div 
                          key={img.image_id} 
                          className={`image-preview-item ${img.is_featured ? 'featured' : ''}`}
                        >
                          {img.is_featured && <div className="featured-badge">★ Featured</div>}
                          
                          <img 
                            src={`${API_BASE_URL}${img.image_path}`} 
                            alt={img.caption || 'Post image'} 
                            className="image-preview-img" 
                          />
                          
                          <div className="image-preview-overlay">
                            <div className="image-preview-actions">
                              {!img.is_featured && (
                                <button
                                  type="button"
                                  onClick={() => setExistingFeaturedImage(img.image_id)}
                                  className="image-preview-btn featured-btn"
                                  title="Set as featured image"
                                >
                                  ★ Featured
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingImage(img.image_id)}
                                className="image-preview-btn delete-btn"
                                title="Remove image"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                            
                            <input
                              type="text"
                              placeholder="Image caption..."
                              value={img.caption || ''}
                              onChange={(e) => updateExistingImageCaption(img.image_id, e.target.value)}
                              className="image-caption-input"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Upload */}
                {formData.images.length < 5 && (
                  <>
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
                        Up to {5 - totalImages} more images • Max 5MB each • JPG, PNG, WebP
                      </div>
                      
                      <div className="paste-instructions">
                        <div className="paste-instruction-item">Copy image (Ctrl+C) then paste here (Ctrl+V)</div>
                        <div className="paste-instruction-item">Drag and drop images from your computer</div>
                        <div className="paste-instruction-item">Click to browse and select images</div>
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
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      className="file-input-hidden"
                    />
                  </>
                )}

                {/* New Images Preview */}
                {formData.images.length > 0 && (
                  <div className="new-images-section">
                    <h5>New Images</h5>
                    <div className="image-preview-grid">
                      {formData.images.map((img) => (
                        <div 
                          key={img.id} 
                          className={`image-preview-item ${img.isFeatured ? 'featured' : ''}`}
                        >
                          {img.isFeatured && <div className="featured-badge">★ Featured</div>}
                          
                          <img 
                            src={img.preview} 
                            alt="Preview" 
                            className="image-preview-img" 
                          />
                          
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
              <label htmlFor="meta_description">Meta Description</label>
              <textarea
                id="meta_description"
                name="meta_description"
                value={formData.meta_description}
                onChange={handleInputChange}
                rows={3}
                placeholder="SEO meta description..."
                maxLength={160}
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
                placeholder="seo, keywords, comma separated"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleBack}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            ← Back
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating Post...' : 'Update Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPosts;