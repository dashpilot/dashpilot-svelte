<script>
	import { onMount } from 'svelte';
	import Navigation from './components/Navigation.svelte';
	import ContentTypesManager from './components/ContentTypesManager.svelte';
	import ContentManager from './components/ContentManager.svelte';
	import CategoriesManager from './components/CategoriesManager.svelte';
	import { contentTypes, categories, content } from './store';

	let currentView = 'content';

	function parseHash() {
		const hash = window.location.hash;
		if (!hash || hash === '#' || hash === '#!') {
			currentView = 'content';
			return;
		}

		// Handle hashbang format: #!/view
		const match = hash.match(/^#!\/?(.+?)$/);
		if (match) {
			const view = match[1];
			if (['content', 'content-types', 'categories'].includes(view)) {
				currentView = view;
			} else {
				// Default to content if unknown view
				currentView = 'content';
			}
		} else {
			// Default to content if hash doesn't match pattern
			currentView = 'content';
		}
	}

	function handleHashChange() {
		parseHash();
	}

	// Load data from data.json on mount
	onMount(async () => {
		// Parse initial hash
		parseHash();

		// Set up hash routing listener
		window.addEventListener('hashchange', handleHashChange);

		try {
			const response = await fetch('/data.json');
			if (response.ok) {
				const data = await response.json();
				// Handle both old and new data structure for migration
				if (data.contentTypes && data.contentTypes.length > 0) {
					contentTypes.set(data.contentTypes);
				} else if (data.postTypes && data.postTypes.length > 0) {
					contentTypes.set(data.postTypes);
				}
				if (data.categories && data.categories.length > 0) {
					categories.set(data.categories);
				}
				if (data.content && data.content.length > 0) {
					// Migrate postType to contentType in content items
					const migratedContent = data.content.map((item) => {
						if (item.postType && !item.contentType) {
							const { postType, ...rest } = item;
							return { ...rest, contentType: postType };
						}
						return item;
					});
					content.set(migratedContent);
				} else if (data.posts && data.posts.length > 0) {
					// Migrate old posts structure
					const migratedContent = data.posts.map((item) => {
						if (item.postType) {
							const { postType, ...rest } = item;
							return { ...rest, contentType: postType };
						}
						return item;
					});
					content.set(migratedContent);
				}
			}
		} catch (error) {
			console.error('Failed to load data:', error);
		}

		return () => {
			window.removeEventListener('hashchange', handleHashChange);
		};
	});

	function setView(view) {
		window.location.hash = `#!/${view}`;
		currentView = view;
	}
</script>

<div class="app">
	<Navigation {currentView} onViewChange={setView} />

	<main class="main-content">
		{#if currentView === 'content'}
			<ContentManager />
		{:else if currentView === 'content-types'}
			<ContentTypesManager />
		{:else if currentView === 'categories'}
			<CategoriesManager />
		{/if}
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		display: flex;
		flex-direction: row;
	}

	.main-content {
		flex: 1;
		padding: 32px 0;
		background: var(--bg-primary);
	}
</style>
