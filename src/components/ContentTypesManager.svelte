<script>
  import { contentTypes, fieldTypes, content, categories } from '../store';
  import { generateUniqueSlug, saveToAPI } from '../utils';

  let editingContentType = null;
  let showForm = false;
  let formData = {
    name: '',
    slug: '',
    fields: []
  };

  function addContentType() {
    editingContentType = null;
    formData = {
      name: '',
      slug: '',
      fields: []
    };
    showForm = true;
  }

  function editContentType(contentType) {
    editingContentType = contentType;
    formData = {
      name: contentType.name,
      slug: contentType.slug,
      fields: JSON.parse(JSON.stringify(contentType.fields))
    };
    showForm = true;
  }

  function handleNameChange(name) {
    formData.name = name;
    if (!editingContentType) {
      formData.slug = generateUniqueSlug(name, $contentTypes);
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

  async function saveContentType() {
    if (!formData.name || !formData.slug) {
      alert('Please provide a name for the content type');
      return;
    }

    const contentTypeData = { ...formData };

    // Update local state first
    if (editingContentType) {
      contentTypes.update(types => 
        types.map(t => t.slug === editingContentType.slug ? contentTypeData : t)
      );
    } else {
      contentTypes.update(types => [...types, contentTypeData]);
    }

    try {
      // Send all data to API
      await saveToAPI({
        contentTypes: $contentTypes,
        content: $content,
        categories: $categories
      });

      showForm = false;
    } catch (error) {
      console.error('Failed to save content type:', error);
      // Revert local state on error
      if (editingContentType) {
        contentTypes.update(types => 
          types.map(t => t.slug === editingContentType.slug ? editingContentType : t)
        );
      } else {
        contentTypes.update(types => types.filter(t => t.slug !== contentTypeData.slug));
      }
      showForm = false;
    }
  }

  async function deleteContentType(contentType) {
    if (confirm(`Are you sure you want to delete "${contentType.name}"?`)) {
      // Update local state first
      contentTypes.update(types => types.filter(t => t.slug !== contentType.slug));
      
      try {
        // Send all data to API
        await saveToAPI({
          contentTypes: $contentTypes,
          content: $content,
          categories: $categories
        });
      } catch (error) {
        console.error('Failed to delete content type:', error);
        // Revert local state on error
        contentTypes.update(types => [...types, contentType]);
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
          <h1 class="card-title">Content Types</h1>
          <p class="card-subtitle">Configure the structure of your content types</p>
        </div>
        {#if !showForm}
          <button class="btn btn-primary" on:click={addContentType}>Add Content Type</button>
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
          <button class="btn btn-primary" on:click={saveContentType}>Save Content Type</button>
          <button class="btn" on:click={cancel}>Cancel</button>
        </div>
      </div>
    {:else}
      {#if $contentTypes.length === 0}
        <div class="empty-state">
          <h2 class="empty-state-title">No content types yet</h2>
          <p class="empty-state-text">Get started by creating your first content type</p>
          <button class="btn btn-primary" on:click={addContentType}>Add Content Type</button>
        </div>
      {:else}
        <table class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Fields</th>
              <th class="actions-header"></th>
            </tr>
          </thead>
          <tbody>
            {#each $contentTypes as contentType}
              <tr>
                <td>{contentType.name}</td>
                <td><code class="badge">{contentType.slug}</code></td>
                <td>{contentType.fields.length} field{contentType.fields.length !== 1 ? 's' : ''}</td>
                <td class="actions-cell">
                  <div class="flex gap-1">
                    <button class="btn btn-sm" on:click={() => editContentType(contentType)}>Edit</button>
                    <button class="btn btn-sm btn-danger" on:click={() => deleteContentType(contentType)}>Delete</button>
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

  .actions-header {
    width: 1%;
    white-space: nowrap;
  }

  .actions-cell {
    text-align: right;
    white-space: nowrap;
  }
</style>

