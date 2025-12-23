<script>
  export let currentView;
  export let onViewChange;
</script>

<nav class="nav">
  <div class="nav-container">
    <a 
      href="#!/content" 
      class="nav-title" 
      on:click|preventDefault={() => onViewChange('content')}
    >
      Dashpilot Admin
    </a>
    <div class="nav-links">
      <a 
        href="#!/content" 
        class="nav-link" 
        class:active={currentView === 'content' || currentView === 'content-detail'}
        on:click|preventDefault={() => onViewChange('content')}
      >
        Content
      </a>
      <a 
        href="#!/content-types" 
        class="nav-link" 
        class:active={currentView === 'content-types'}
        on:click|preventDefault={() => onViewChange('content-types')}
      >
        Content Types
      </a>
      <a 
        href="#!/categories" 
        class="nav-link" 
        class:active={currentView === 'categories'}
        on:click|preventDefault={() => onViewChange('categories')}
      >
        Categories
      </a>
    </div>
  </div>
</nav>

