<script>
  import { categories } from '../store';
  import { generateUniqueSlug } from '../utils';
  import { saveToAPI } from '../utils';

  let editingCategory = null;
  let showForm = false;
  let formData = {
    name: '',
    slug: ''
  };

  function addCategory() {
    editingCategory = null;
    formData = { name: '', slug: '' };
    showForm = true;
  }

  function editCategory(category) {
    editingCategory = category;
    formData = {
      name: category.name,
      slug: category.slug
    };
    showForm = true;
  }

  function handleNameChange(name) {
    formData.name = name;
    if (!editingCategory) {
      formData.slug = generateUniqueSlug(name, $categories);
    }
  }

  async function saveCategory() {
    if (!formData.name || !formData.slug) {
      alert('Please provide a name for the category');
      return;
    }

    const categoryData = { ...formData };

    try {
      await saveToAPI({ type: 'category', data: categoryData });
      
      if (editingCategory) {
        categories.update(cats => 
          cats.map(c => c.slug === editingCategory.slug ? categoryData : c)
        );
      } else {
        categories.update(cats => [...cats, categoryData]);
      }

      showForm = false;
    } catch (error) {
      console.error('Failed to save category:', error);
      // For now, still update local state even if API fails
      if (editingCategory) {
        categories.update(cats => 
          cats.map(c => c.slug === editingCategory.slug ? categoryData : c)
        );
      } else {
        categories.update(cats => [...cats, categoryData]);
      }
      showForm = false;
    }
  }

  async function deleteCategory(category) {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await saveToAPI({ type: 'category', action: 'delete', data: category });
        categories.update(cats => cats.filter(c => c.slug !== category.slug));
      } catch (error) {
        console.error('Failed to delete category:', error);
        // Still update local state
        categories.update(cats => cats.filter(c => c.slug !== category.slug));
      }
    }
  }

  function cancel() {
    showForm = false;
    formData = { name: '', slug: '' };
  }
</script>

<div class="container">
  <div class="card">
    <div class="card-header">
      <div class="flex-between">
        <div>
          <h1 class="card-title">Categories</h1>
          <p class="card-subtitle">Organize your content with categories</p>
        </div>
        {#if !showForm}
          <button class="btn btn-primary" on:click={addCategory}>Add Category</button>
        {/if}
      </div>
    </div>

    {#if showForm}
      <div class="form-section">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input 
            type="text" 
            class="form-input" 
            bind:value={formData.name}
            on:input={(e) => handleNameChange(e.target.value)}
            placeholder="e.g., Technology, Design"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Slug</label>
          <input 
            type="text" 
            class="form-input" 
            bind:value={formData.slug}
            placeholder="auto-generated-slug"
          />
        </div>

        <div class="flex gap-2">
          <button class="btn btn-primary" on:click={saveCategory}>Save Category</button>
          <button class="btn" on:click={cancel}>Cancel</button>
        </div>
      </div>
    {:else}
      {#if $categories.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No categories yet</h2>
          <p class="empty-state-text">Get started by creating your first category</p>
          <button class="btn btn-primary" on:click={addCategory}>Add Category</button>
        </div>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $categories as category}
              <tr>
                <td>{category.name}</td>
                <td><code class="badge">{category.slug}</code></td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-sm" on:click={() => editCategory(category)}>Edit</button>
                    <button class="btn btn-sm btn-danger" on:click={() => deleteCategory(category)}>Delete</button>
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

  code {
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    padding: 2px 6px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
  }
</style>

