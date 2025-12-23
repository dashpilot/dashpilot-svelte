<script>
  import { onMount } from 'svelte';
  import Navigation from './components/Navigation.svelte';
  import PostTypesManager from './components/PostTypesManager.svelte';
  import PostsManager from './components/PostsManager.svelte';
  import CategoriesManager from './components/CategoriesManager.svelte';
  import { postTypes, categories, posts } from './store';

  let currentView = 'posts';
  
  // Load data from data.json on mount
  onMount(async () => {
    try {
      const response = await fetch('/data.json');
      if (response.ok) {
        const data = await response.json();
        if (data.postTypes && data.postTypes.length > 0) {
          postTypes.set(data.postTypes);
        }
        if (data.categories && data.categories.length > 0) {
          categories.set(data.categories);
        }
        if (data.posts && data.posts.length > 0) {
          posts.set(data.posts);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  });

  function setView(view) {
    currentView = view;
  }
</script>

<div class="app">
  <Navigation currentView={currentView} onViewChange={setView} />
  
  <main class="main-content">
    {#if currentView === 'posts'}
      <PostsManager />
    {:else if currentView === 'categories'}
      <CategoriesManager />
    {:else if currentView === 'post-types'}
      <PostTypesManager />
    {/if}
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: 32px 0;
  }
</style>

