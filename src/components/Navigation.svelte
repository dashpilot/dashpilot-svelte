<script>
  export let currentView;
  export let onViewChange;
</script>

<nav class="nav">
  <div class="nav-container">
    <a 
      href="#" 
      class="nav-title" 
      on:click|preventDefault={() => onViewChange('posts')}
    >
      Dashpilot Admin
    </a>
    <div class="nav-links">
      <a 
        href="#" 
        class="nav-link" 
        class:active={currentView === 'posts'}
        on:click|preventDefault={() => onViewChange('posts')}
      >
        Posts
      </a>
      <a 
        href="#" 
        class="nav-link" 
        class:active={currentView === 'categories'}
        on:click|preventDefault={() => onViewChange('categories')}
      >
        Categories
      </a>
      <a 
        href="#" 
        class="nav-link" 
        class:active={currentView === 'post-types'}
        on:click|preventDefault={() => onViewChange('post-types')}
      >
        Post Types
      </a>
    </div>
  </div>
</nav>

