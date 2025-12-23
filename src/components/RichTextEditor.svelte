<script>
  import { onMount, createEventDispatcher } from 'svelte';

  export let value = '';
  export let placeholder = '';

  const dispatch = createEventDispatcher();
  let editorElement;
  let lastValue = value || '';

  function handleInput() {
    if (editorElement) {
      const newValue = editorElement.innerHTML;
      value = newValue;
      lastValue = newValue;
      dispatch('valueChange', { value: newValue });
    }
  }

  function formatCommand(command, commandValue = null) {
    if (!editorElement) return;
    document.execCommand(command, false, commandValue);
    editorElement.focus();
    handleInput();
  }

  function handleBold() {
    formatCommand('bold');
  }

  function handleItalic() {
    formatCommand('italic');
  }

  function handleLink() {
    const url = prompt('Enter URL:');
    if (url) {
      formatCommand('createLink', url);
    }
  }

  function handleKeyDown(e) {
    // Handle Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      handleBold();
    }
    // Handle Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      handleItalic();
    }
    // Handle Ctrl/Cmd + K for link
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      handleLink();
    }
  }

  $: if (editorElement && value !== lastValue) {
    const newValue = value || '';
    editorElement.innerHTML = newValue;
    lastValue = newValue;
  }

  onMount(() => {
    if (editorElement) {
      const initialValue = value || '';
      editorElement.innerHTML = initialValue;
      lastValue = initialValue;
    }
  });
</script>

<div class="richtext-editor">
  <div class="richtext-toolbar">
    <button 
      type="button" 
      class="toolbar-btn"
      on:click={handleBold}
      title="Bold (Ctrl+B)"
    >
      <i class="bi bi-type-bold"></i>
    </button>
    <button 
      type="button" 
      class="toolbar-btn"
      on:click={handleItalic}
      title="Italic (Ctrl+I)"
    >
      <i class="bi bi-type-italic"></i>
    </button>
    <button 
      type="button" 
      class="toolbar-btn"
      on:click={handleLink}
      title="Link (Ctrl+K)"
    >
      <i class="bi bi-link-45deg"></i>
    </button>
  </div>
  <div
    bind:this={editorElement}
    contenteditable="true"
    class="richtext-content"
    on:input={handleInput}
    on:keydown={handleKeyDown}
    data-placeholder={placeholder}
  ></div>
</div>

<style>
  .richtext-editor {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
  }

  .richtext-toolbar {
    display: flex;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-secondary);
    border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  }

  .toolbar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }

  .toolbar-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--accent);
  }

  .toolbar-btn i {
    display: inline-block;
    font-size: 16px;
  }

  .richtext-content {
    min-height: 200px;
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
    color: var(--text-primary);
  }

  .richtext-content:empty:before {
    content: attr(data-placeholder);
    color: var(--text-tertiary);
  }

  .richtext-content:focus {
    outline: none;
  }

  .richtext-content a {
    color: var(--success);
    text-decoration: underline;
  }

  .richtext-content a:hover {
    color: var(--success-hover);
  }
</style>

