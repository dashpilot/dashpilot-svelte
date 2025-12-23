<script>
  import { postTypes, fieldTypes } from '../store';
  import { generateUniqueSlug, saveToAPI } from '../utils';

  let editingPostType = null;
  let showForm = false;
  let formData = {
    name: '',
    slug: '',
    fields: []
  };

  function addPostType() {
    editingPostType = null;
    formData = {
      name: '',
      slug: '',
      fields: []
    };
    showForm = true;
  }

  function editPostType(postType) {
    editingPostType = postType;
    formData = {
      name: postType.name,
      slug: postType.slug,
      fields: JSON.parse(JSON.stringify(postType.fields))
    };
    showForm = true;
  }

  function handleNameChange(name) {
    formData.name = name;
    if (!editingPostType) {
      formData.slug = generateUniqueSlug(name, $postTypes);
    }
  }

  function addField() {
    formData.fields = [...formData.fields, {
      name: '',
      slug: '',
      type: 'text',
      required: false,
      options: ''
    }];
  }

  function removeField(index) {
    formData.fields = formData.fields.filter((_, i) => i !== index);
  }

  function handleFieldNameChange(index, name) {
    formData.fields[index].name = name;
    const existingSlugs = formData.fields.map(f => f.slug).filter((s, i) => i !== index);
    formData.fields[index].slug = generateUniqueSlug(name, existingSlugs.map(s => ({ slug: s })));
  }

  async function savePostType() {
    if (!formData.name || !formData.slug) {
      alert('Please provide a name for the post type');
      return;
    }

    const postTypeData = { ...formData };

    try {
      await saveToAPI({ type: 'postType', data: postTypeData });
      
      if (editingPostType) {
        postTypes.update(types => 
          types.map(t => t.slug === editingPostType.slug ? postTypeData : t)
        );
      } else {
        postTypes.update(types => [...types, postTypeData]);
      }

      showForm = false;
    } catch (error) {
      console.error('Failed to save post type:', error);
      // For now, still update local state even if API fails
      if (editingPostType) {
        postTypes.update(types => 
          types.map(t => t.slug === editingPostType.slug ? postTypeData : t)
        );
      } else {
        postTypes.update(types => [...types, postTypeData]);
      }
      showForm = false;
    }
  }

  async function deletePostType(postType) {
    if (confirm(`Are you sure you want to delete "${postType.name}"?`)) {
      try {
        await saveToAPI({ type: 'postType', action: 'delete', data: postType });
        postTypes.update(types => types.filter(t => t.slug !== postType.slug));
      } catch (error) {
        console.error('Failed to delete post type:', error);
        // Still update local state
        postTypes.update(types => types.filter(t => t.slug !== postType.slug));
      }
    }
  }

  function cancel() {
    showForm = false;
    formData = { name: '', slug: '', fields: [] };
  }
</script>

<div class="container">
  <div class="card">
    <div class="card-header">
      <div class="flex-between">
        <div>
          <h1 class="card-title">Post Types</h1>
          <p class="card-subtitle">Configure the structure of your content types</p>
        </div>
        {#if !showForm}
          <button class="btn btn-primary" on:click={addPostType}>Add Post Type</button>
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
            placeholder="e.g., Blog Post, Product"
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

        <div class="form-group">
          <div class="flex-between mb-2">
            <label class="form-label">Fields</label>
            <button class="btn btn-sm" on:click={addField}>Add Field</button>
          </div>

          {#each formData.fields as field, index}
            <div class="field-config">
              <div class="flex gap-2 mb-2">
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="Field Name"
                  bind:value={field.name}
                  on:input={(e) => handleFieldNameChange(index, e.target.value)}
                />
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="slug"
                  bind:value={field.slug}
                  readonly
                />
                <select class="form-select" bind:value={field.type}>
                  {#each fieldTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
                <label class="flex" style="align-items: center; gap: 8px;">
                  <input type="checkbox" bind:checked={field.required} />
                  <span style="font-size: 14px;">Required</span>
                </label>
                <button class="btn btn-sm btn-danger" on:click={() => removeField(index)}>Remove</button>
              </div>
              {#if field.type === 'select'}
                <input 
                  type="text" 
                  class="form-input" 
                  placeholder="Options (comma-separated)"
                  bind:value={field.options}
                />
              {/if}
            </div>
          {:else}
            <p class="empty-state-text">No fields added yet. Click "Add Field" to get started.</p>
          {/each}
        </div>

        <div class="flex gap-2">
          <button class="btn btn-primary" on:click={savePostType}>Save Post Type</button>
          <button class="btn" on:click={cancel}>Cancel</button>
        </div>
      </div>
    {:else}
      {#if $postTypes.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No post types yet</h2>
          <p class="empty-state-text">Get started by creating your first post type</p>
          <button class="btn btn-primary" on:click={addPostType}>Add Post Type</button>
        </div>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Fields</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each $postTypes as postType}
              <tr>
                <td>{postType.name}</td>
                <td><code class="badge">{postType.slug}</code></td>
                <td>{postType.fields.length} field{postType.fields.length !== 1 ? 's' : ''}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-sm" on:click={() => editPostType(postType)}>Edit</button>
                    <button class="btn btn-sm btn-danger" on:click={() => deletePostType(postType)}>Delete</button>
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

  .field-config {
    margin-bottom: 16px;
    padding: 16px;
    background: var(--bg-secondary);
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

