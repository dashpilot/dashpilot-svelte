<script>
  import { posts, postTypes, categories } from '../store';
  import { saveToAPI } from '../utils';
  import RichTextEditor from './RichTextEditor.svelte';

  let selectedPostType = '';
  let editingPost = null;
  let showForm = false;
  let formData = {};
  let sortColumn = 'updatedAt';
  let sortDirection = 'desc'; // 'asc' or 'desc'

  $: availablePostTypes = $postTypes;
  $: availableCategories = $categories;
  
  // Ensure formData.fields always exists
  $: if (showForm && formData && !formData.fields) {
    formData.fields = {};
  }

  function handlePostTypeSelect() {
    if (!selectedPostType) return;
    
    const postType = $postTypes.find(pt => pt.slug === selectedPostType);
    if (!postType) return;

    editingPost = null;
    showForm = true;
    
    // Initialize form data based on post type fields
    formData = {
      postType: selectedPostType,
      title: '',
      category: '',
      fields: {}
    };

    // Initialize all field values
    postType.fields.forEach(field => {
      if (field.type === 'checkbox') {
        formData.fields[field.slug] = false;
      } else if (field.type === 'gallery') {
        formData.fields[field.slug] = [];
      } else {
        formData.fields[field.slug] = '';
      }
    });
  }

  function editPost(post) {
    editingPost = post;
    selectedPostType = post.postType;
    
    const postType = $postTypes.find(pt => pt.slug === post.postType);
    if (!postType) return;
    
    // Initialize form data with existing post data
    formData = {
      ...JSON.parse(JSON.stringify(post)),
      fields: post.fields ? { ...post.fields } : {}
    };
    
    // Ensure all fields from post type are initialized
    postType.fields.forEach(field => {
      if (!(field.slug in formData.fields)) {
        if (field.type === 'checkbox') {
          formData.fields[field.slug] = false;
        } else if (field.type === 'gallery') {
          formData.fields[field.slug] = [];
        } else {
          formData.fields[field.slug] = '';
        }
      }
    });
    
    showForm = true;
  }

  async function savePost() {
    if (!formData.title || !formData.postType) {
      alert('Please provide a title');
      return;
    }

    const postType = $postTypes.find(pt => pt.slug === formData.postType);
    if (!postType) return;

    // Ensure fields object exists
    if (!formData.fields) {
      formData.fields = {};
    }

    // Validate required fields
    for (const field of postType.fields) {
      if (field.required) {
        const value = formData.fields[field.slug];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          alert(`Field "${field.name}" is required`);
          return;
        }
      }
    }

    const postData = {
      ...formData,
      id: editingPost?.id || Date.now().toString(),
      updatedAt: new Date().toISOString(),
      createdAt: editingPost?.createdAt || new Date().toISOString()
    };

    try {
      await saveToAPI({ type: 'post', data: postData });
      
      if (editingPost) {
        posts.update(p => p.map(po => po.id === editingPost.id ? postData : po));
      } else {
        posts.update(p => [...p, postData]);
      }

      showForm = false;
      selectedPostType = '';
      formData = {};
    } catch (error) {
      console.error('Failed to save post:', error);
      // For now, still update local state even if API fails
      if (editingPost) {
        posts.update(p => p.map(po => po.id === editingPost.id ? postData : po));
      } else {
        posts.update(p => [...p, postData]);
      }
      showForm = false;
      selectedPostType = '';
      formData = {};
    }
  }

  async function deletePost(post) {
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      try {
        await saveToAPI({ type: 'post', action: 'delete', data: post });
        posts.update(p => p.filter(po => po.id !== post.id));
      } catch (error) {
        console.error('Failed to delete post:', error);
        // Still update local state
        posts.update(p => p.filter(po => po.id !== post.id));
      }
    }
  }

  function cancel() {
    showForm = false;
    selectedPostType = '';
    formData = {};
  }

  function getPostTypeName(slug) {
    const pt = $postTypes.find(p => p.slug === slug);
    return pt ? pt.name : slug;
  }

  function getCategoryName(slug) {
    if (!slug) return null;
    const cat = $categories.find(c => c.slug === slug);
    return cat ? cat.name : slug;
  }

  function getPostCategory(post) {
    // Check top-level category first
    if (post.category) {
      return getCategoryName(post.category);
    }
    // Check if there's a category field in fields
    if (post.fields && post.fields.category) {
      return getCategoryName(post.fields.category);
    }
    return null;
  }

  function handleImageUpload(fieldSlug) {
    // Placeholder for image upload - in real implementation, this would handle file uploads
    const url = prompt('Enter image URL (placeholder):');
    if (url) {
      formData.fields[fieldSlug] = url;
    }
  }

  function handleGalleryAdd(fieldSlug) {
    const url = prompt('Enter image URL (placeholder):');
    if (url) {
      if (!formData.fields[fieldSlug]) {
        formData.fields[fieldSlug] = [];
      }
      formData.fields[fieldSlug] = [...formData.fields[fieldSlug], url];
    }
  }

  function handleGalleryRemove(fieldSlug, index) {
    formData.fields[fieldSlug] = formData.fields[fieldSlug].filter((_, i) => i !== index);
  }

  function handleSort(column) {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  let filteredPosts = [];
  
  $: {
    const filtered = selectedPostType 
      ? $posts.filter(p => p.postType === selectedPostType)
      : $posts;
    
    // Reference sortColumn and sortDirection directly to ensure reactivity
    filteredPosts = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'postType':
          aValue = getPostTypeName(a.postType);
          bValue = getPostTypeName(b.postType);
          break;
        case 'category':
          aValue = getPostCategory(a) || '';
          bValue = getPostCategory(b) || '';
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt || 0).getTime();
          bValue = new Date(b.updatedAt || 0).getTime();
          break;
        default:
          return 0;
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
</script>

<div class="container">
  <div class="card">
    <div class="card-header">
      <div class="flex-between">
        <div>
          <h1 class="card-title">Posts</h1>
          <p class="card-subtitle">Manage your content posts</p>
        </div>
        {#if !showForm && $postTypes.length > 0}
          <div class="flex gap-2">
            <select class="form-select" bind:value={selectedPostType} style="width: auto;">
              <option value="">All Post Types</option>
              {#each $postTypes as pt}
                <option value={pt.slug}>{pt.name}</option>
              {/each}
            </select>
            <button class="btn btn-primary" on:click={handlePostTypeSelect} disabled={!selectedPostType}>
              Add Post
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if showForm}
      {@const postType = $postTypes.find(pt => pt.slug === formData.postType)}
      {#if postType && formData.fields}
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input 
              type="text" 
              class="form-input" 
              bind:value={formData.title}
              placeholder="Post title"
            />
          </div>

          {#if $categories.length > 0}
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" bind:value={formData.category}>
                <option value="">None</option>
                {#each $categories as category}
                  <option value={category.slug}>{category.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          {#each postType.fields as field}
            <div class="form-group">
              <label class="form-label">
                {field.name}
                {#if field.required}*{/if}
              </label>

              {#if field.type === 'text'}
                <input 
                  type="text" 
                  class="form-input" 
                  value={formData.fields?.[field.slug] || ''}
                  on:input={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                  placeholder={field.name}
                />
              {:else if field.type === 'textarea'}
                <textarea 
                  class="form-textarea" 
                  value={formData.fields?.[field.slug] || ''}
                  on:input={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                  placeholder={field.name}
                ></textarea>
              {:else if field.type === 'richtext'}
                {@const fieldValue = (formData.fields && formData.fields[field.slug]) || ''}
                <RichTextEditor 
                  value={fieldValue}
                  on:valueChange={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.detail.value;
                  }}
                  placeholder={field.name}
                />
              {:else if field.type === 'image'}
                <div class="image-field">
                  <input 
                    type="text" 
                    class="form-input" 
                    value={formData.fields?.[field.slug] || ''}
                    on:input={(e) => {
                      if (!formData.fields) formData.fields = {};
                      formData.fields[field.slug] = e.target.value;
                    }}
                    placeholder="Image URL"
                  />
                  <button type="button" class="btn btn-sm mt-1" on:click={() => handleImageUpload(field.slug)}>
                    Upload Image
                  </button>
                  {#if formData.fields?.[field.slug]}
                    <img src={formData.fields[field.slug]} alt={field.name} class="image-preview" />
                  {/if}
                </div>
              {:else if field.type === 'gallery'}
                <div class="gallery-field">
                  <button type="button" class="btn btn-sm mb-2" on:click={() => handleGalleryAdd(field.slug)}>
                    Add Image
                  </button>
                  {#if formData.fields?.[field.slug] && formData.fields[field.slug].length > 0}
                    <div class="gallery-grid">
                      {#each formData.fields[field.slug] as url, index}
                        <div class="gallery-item">
                          <img src={url} alt="Gallery image {index + 1}" />
                          <button type="button" class="btn btn-sm btn-danger" on:click={() => handleGalleryRemove(field.slug, index)}>
                            Remove
                          </button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {:else if field.type === 'date'}
                <input 
                  type="date" 
                  class="form-input" 
                  value={formData.fields?.[field.slug] || ''}
                  on:input={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                />
              {:else if field.type === 'number'}
                <input 
                  type="number" 
                  class="form-input" 
                  value={formData.fields?.[field.slug] || ''}
                  on:input={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                  placeholder={field.name}
                />
              {:else if field.type === 'select'}
                <select 
                  class="form-select" 
                  value={formData.fields?.[field.slug] || ''}
                  on:change={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                >
                  <option value="">Select {field.name}</option>
                  {#each (field.options || '').split(',').map(o => o.trim()).filter(o => o) as option}
                    <option value={option}>{option}</option>
                  {/each}
                </select>
              {:else if field.type === 'category'}
                <select 
                  class="form-select" 
                  value={formData.fields?.[field.slug] || ''}
                  on:change={(e) => {
                    if (!formData.fields) formData.fields = {};
                    formData.fields[field.slug] = e.target.value;
                  }}
                >
                  <option value="">Select {field.name}</option>
                  {#each $categories as category}
                    <option value={category.slug}>{category.name}</option>
                  {/each}
                </select>
              {:else if field.type === 'checkbox'}
                <label class="flex" style="align-items: center; gap: 8px;">
                  <input 
                    type="checkbox" 
                    checked={formData.fields?.[field.slug] || false}
                    on:change={(e) => {
                      if (!formData.fields) formData.fields = {};
                      formData.fields[field.slug] = e.target.checked;
                    }}
                  />
                  <span>{field.name}</span>
                </label>
              {/if}
            </div>
          {/each}

          <div class="flex gap-2">
            <button class="btn btn-primary" on:click={savePost}>Save Post</button>
            <button class="btn" on:click={cancel}>Cancel</button>
          </div>
        </div>
      {/if}
    {:else}
      {#if $postTypes.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No post types configured</h2>
          <p class="empty-state-text">Create a post type first to start adding posts</p>
        </div>
      {:else if filteredPosts.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No posts yet</h2>
          <p class="empty-state-text">
            {#if selectedPostType}
              Get started by creating your first {getPostTypeName(selectedPostType).toLowerCase()}
            {:else}
              Select a post type and click "Add Post" to get started
            {/if}
          </p>
        </div>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th class="sortable" on:click={() => handleSort('title')}>
                <span>Title</span>
                {#if sortColumn === 'title'}
                  <i class="bi bi-chevron-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                {/if}
              </th>
              <th class="sortable" on:click={() => handleSort('postType')}>
                <span>Post Type</span>
                {#if sortColumn === 'postType'}
                  <i class="bi bi-chevron-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                {/if}
              </th>
              <th class="sortable" on:click={() => handleSort('category')}>
                <span>Category</span>
                {#if sortColumn === 'category'}
                  <i class="bi bi-chevron-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                {/if}
              </th>
              <th class="sortable" on:click={() => handleSort('updatedAt')}>
                <span>Updated</span>
                {#if sortColumn === 'updatedAt'}
                  <i class="bi bi-chevron-{sortDirection === 'asc' ? 'up' : 'down'}"></i>
                {/if}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredPosts as post}
              <tr>
                <td>{post.title}</td>
                <td><code class="badge">{getPostTypeName(post.postType)}</code></td>
                <td>{getPostCategory(post) || '-'}</td>
                <td>{new Date(post.updatedAt).toLocaleDateString()}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-sm" on:click={() => editPost(post)}>Edit</button>
                    <button class="btn btn-sm btn-danger" on:click={() => deletePost(post)}>Delete</button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    {/if}
  </div>
</div>

<style>
  .form-section {
    margin-top: 24px;
  }

  .sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
    padding-right: 24px;
  }

  .sortable:hover {
    background: var(--bg-tertiary);
  }

  .sortable span {
    margin-right: 8px;
  }

  .sortable i {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: var(--text-secondary);
  }

  .image-field {
    display: flex;
    flex-direction: column;
  }

  .image-preview {
    max-width: 300px;
    max-height: 300px;
    margin-top: 12px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
  }

  .gallery-field {
    display: flex;
    flex-direction: column;
  }

  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    margin-top: 12px;
  }

  .gallery-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gallery-item img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-color);
  }

  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }
</style>

