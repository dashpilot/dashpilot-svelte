<script>
  import { onMount } from 'svelte';
  import { content, contentTypes, categories } from '../store';
  import { saveToAPI } from '../utils';
  import RichTextEditor from './RichTextEditor.svelte';

  let selectedContentType = '';
  let editingContent = null;
  let showForm = false;
  let formData = {};
  let sortColumn = 'updatedAt';
  let sortDirection = 'desc'; // 'asc' or 'desc'

  $: availableContentTypes = $contentTypes;
  $: availableCategories = $categories;
  
  // Ensure formData.fields always exists
  $: if (showForm && formData && !formData.fields) {
    formData.fields = {};
  }

  function parseHash() {
    const hash = window.location.hash;
    if (!hash || hash === '#' || hash === '#!') {
      showForm = false;
      editingContent = null;
      return;
    }

    // Handle hashbang format: #!/content/[id] for editing
    const match = hash.match(/^#!\/content\/(.+)$/);
    if (match) {
      const contentId = match[1];
      const contentItem = $content.find(c => c.id === contentId);
      if (contentItem) {
        editContent(contentItem);
      }
    } else if (hash === '#!/content') {
      showForm = false;
      editingContent = null;
    }
  }

  function handleHashChange() {
    parseHash();
  }

  onMount(() => {
    parseHash();
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  });

  // Watch for content changes to update hash if needed (only if we're on a content detail URL)
  $: if ($content.length > 0 && window.location.hash.match(/^#!\/content\/(.+)$/)) {
    parseHash();
  }

  function handleContentTypeSelect() {
    if (!selectedContentType) return;
    
    const contentType = $contentTypes.find(ct => ct.slug === selectedContentType);
    if (!contentType) return;

    editingContent = null;
    showForm = true;
    
    // Initialize form data based on content type fields
    formData = {
      contentType: selectedContentType,
      title: '',
      category: '',
      fields: {}
    };

    // Initialize all field values
    contentType.fields.forEach(field => {
      if (field.type === 'checkbox') {
        formData.fields[field.slug] = false;
      } else if (field.type === 'gallery') {
        formData.fields[field.slug] = [];
      } else {
        formData.fields[field.slug] = '';
      }
    });
    
    // Clear hash for new content
    window.location.hash = '#!/content';
  }

  function editContent(contentItem) {
    editingContent = contentItem;
    selectedContentType = contentItem.contentType;
    
    const contentType = $contentTypes.find(ct => ct.slug === contentItem.contentType);
    if (!contentType) return;
    
    // Initialize form data with existing content data
    formData = {
      ...JSON.parse(JSON.stringify(contentItem)),
      fields: contentItem.fields ? { ...contentItem.fields } : {}
    };
    
    // Ensure all fields from content type are initialized
    contentType.fields.forEach(field => {
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
    // Update URL to hashbang
    window.location.hash = `#!/content/${contentItem.id}`;
  }

  async function saveContent() {
    if (!formData.title || !formData.contentType) {
      alert('Please provide a title');
      return;
    }

    const contentType = $contentTypes.find(ct => ct.slug === formData.contentType);
    if (!contentType) return;

    // Ensure fields object exists
    if (!formData.fields) {
      formData.fields = {};
    }

    // Validate required fields
    for (const field of contentType.fields) {
      if (field.required) {
        const value = formData.fields[field.slug];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          alert(`Field "${field.name}" is required`);
          return;
        }
      }
    }

    const contentData = {
      ...formData,
      id: editingContent?.id || Date.now().toString(),
      updatedAt: new Date().toISOString(),
      createdAt: editingContent?.createdAt || new Date().toISOString()
    };

    // Update local state first
    if (editingContent) {
      content.update(c => c.map(co => co.id === editingContent.id ? contentData : co));
    } else {
      content.update(c => [...c, contentData]);
    }

    try {
      // Send all data to API
      await saveToAPI({
        contentTypes: $contentTypes,
        content: $content,
        categories: $categories
      });

      showForm = false;
      selectedContentType = '';
      formData = {};
      editingContent = null;
      // Update URL back to content list
      window.location.hash = '#!/content';
    } catch (error) {
      console.error('Failed to save content:', error);
      // Revert local state on error
      if (editingContent) {
        content.update(c => c.map(co => co.id === editingContent.id ? editingContent : co));
      } else {
        content.update(c => c.filter(co => co.id !== contentData.id));
      }
      showForm = false;
      selectedContentType = '';
      formData = {};
      editingContent = null;
    }
  }

  async function deleteContent(contentItem) {
    if (confirm(`Are you sure you want to delete "${contentItem.title}"?`)) {
      // Update local state first
      content.update(c => c.filter(co => co.id !== contentItem.id));
      
      try {
        // Send all data to API
        await saveToAPI({
          contentTypes: $contentTypes,
          content: $content,
          categories: $categories
        });
      } catch (error) {
        console.error('Failed to delete content:', error);
        // Revert local state on error
        content.update(c => [...c, contentItem]);
      }
    }
  }

  function cancel() {
    showForm = false;
    selectedContentType = '';
    formData = {};
    editingContent = null;
    // Update URL back to content list
    window.location.hash = '#!/content';
  }

  function getContentTypeName(slug) {
    const ct = $contentTypes.find(c => c.slug === slug);
    return ct ? ct.name : slug;
  }

  function getCategoryName(slug) {
    if (!slug) return null;
    const cat = $categories.find(c => c.slug === slug);
    return cat ? cat.name : slug;
  }

  function getContentCategory(contentItem) {
    // Check top-level category first
    if (contentItem.category) {
      return getCategoryName(contentItem.category);
    }
    // Check if there's a category field in fields
    if (contentItem.fields && contentItem.fields.category) {
      return getCategoryName(contentItem.fields.category);
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

  let filteredContent = [];
  
  $: {
    const filtered = selectedContentType 
      ? $content.filter(c => c.contentType === selectedContentType)
      : $content;
    
    // Reference sortColumn and sortDirection directly to ensure reactivity
    filteredContent = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortColumn) {
        case 'title':
          aValue = a.title || '';
          bValue = b.title || '';
          break;
        case 'contentType':
          aValue = getContentTypeName(a.contentType);
          bValue = getContentTypeName(b.contentType);
          break;
        case 'category':
          aValue = getContentCategory(a) || '';
          bValue = getContentCategory(b) || '';
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
          <h1 class="card-title">Content</h1>
          <p class="card-subtitle">Manage your content</p>
        </div>
        {#if !showForm && $contentTypes.length > 0}
          <div class="flex gap-2">
            <select class="form-select" bind:value={selectedContentType} style="width: auto;">
              <option value="">All Content Types</option>
              {#each $contentTypes as ct}
                <option value={ct.slug}>{ct.name}</option>
              {/each}
            </select>
            <button class="btn btn-primary" on:click={handleContentTypeSelect} disabled={!selectedContentType}>
              Add Content
            </button>
          </div>
        {/if}
      </div>
    </div>

    {#if showForm}
      {@const contentType = $contentTypes.find(ct => ct.slug === formData.contentType)}
      {#if contentType && formData.fields}
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input 
              type="text" 
              class="form-input" 
              bind:value={formData.title}
              placeholder="Content title"
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

          {#each contentType.fields as field}
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
            <button class="btn btn-primary" on:click={saveContent}>Save Content</button>
            <button class="btn" on:click={cancel}>Cancel</button>
          </div>
        </div>
      {/if}
    {:else}
      {#if $contentTypes.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No content types configured</h2>
          <p class="empty-state-text">Create a content type first to start adding content</p>
        </div>
      {:else if filteredContent.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No content yet</h2>
          <p class="empty-state-text">
            {#if selectedContentType}
              Get started by creating your first {getContentTypeName(selectedContentType).toLowerCase()}
            {:else}
              Select a content type and click "Add Content" to get started
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
              <th class="sortable" on:click={() => handleSort('contentType')}>
                <span>Content Type</span>
                {#if sortColumn === 'contentType'}
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
              <th class="actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {#each filteredContent as contentItem}
              <tr>
                <td>
                  <a 
                    href="#!/content/{contentItem.id}" 
                    class="content-link"
                    on:click|preventDefault={() => editContent(contentItem)}
                  >
                    {contentItem.title}
                  </a>
                </td>
                <td><code class="badge">{getContentTypeName(contentItem.contentType)}</code></td>
                <td>{getContentCategory(contentItem) || '-'}</td>
                <td>{new Date(contentItem.updatedAt).toLocaleDateString()}</td>
                <td class="actions-cell">
                  <div class="flex gap-1">
                    <button class="btn btn-sm" on:click={() => editContent(contentItem)}>Edit</button>
                    <button class="btn btn-sm btn-danger" on:click={() => deleteContent(contentItem)}>Delete</button>
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

  .content-link {
    color: var(--text-primary);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .content-link:hover {
    color: var(--success);
    text-decoration: underline;
  }

  .actions-header {
    width: 1%;
    white-space: nowrap;
  }

  .actions-cell {
    text-align: right;
    white-space: nowrap;
  }
</style>

