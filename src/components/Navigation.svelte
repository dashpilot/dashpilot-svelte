<script>
  export let currentView;
  export let onViewChange;
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <a 
      href="#!/content" 
      class="sidebar-title" 
      on:click|preventDefault={() => onViewChange('content')}
    >
      Dashpilot Admin
    </a>
  </div>
  
  <nav class="sidebar-nav">
    <a 
      href="#!/content" 
      class="sidebar-link" 
      class:active={currentView === 'content'}
      on:click|preventDefault={() => onViewChange('content')}
    >
      <i class="bi bi-file-text"></i>
      <span>Content</span>
    </a>
    <a 
      href="#!/content-types" 
      class="sidebar-link" 
      class:active={currentView === 'content-types'}
      on:click|preventDefault={() => onViewChange('content-types')}
    >
      <i class="bi bi-list-ul"></i>
      <span>Content Types</span>
    </a>
    <a 
      href="#!/categories" 
      class="sidebar-link" 
      class:active={currentView === 'categories'}
      on:click|preventDefault={() => onViewChange('categories')}
    >
      <i class="bi bi-tags"></i>
      <span>Categories</span>
    </a>
  </nav>
</aside>

