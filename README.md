# Dashpilot Admin

A content management system built with Svelte and Vite (not SvelteKit) that allows you to configure post types with various field types and manage posts and categories.

## Features

- **Post Type Configuration**: Define custom post types with configurable field types (text, textarea, richtext, image, gallery, date, number, select, checkbox)
- **Post Management**: Add and edit posts based on your configured post types
- **Category Management**: Organize posts with categories (with automatic slug generation)
- **Vercel-inspired Design**: Clean, modern light mode UI inspired by Vercel's design system

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

The built files will be in the `dist` directory with fixed filenames as configured in `vite.config.js`.

## API Endpoint

The system posts data to `/api/save` which is implemented as a Vite plugin for local development. All data is saved to `data.json` in the project root.

The payload structure is:

```json
{
  "type": "post" | "category" | "postType",
  "action": "delete" (optional),
  "data": { ... }
}
```

For production, you'll need to implement your own `/api/save` endpoint that handles the same payload structure.

## Data Storage

Data is automatically saved to `data.json` in the project root. The file structure is:

```json
{
  "postTypes": [...],
  "posts": [...],
  "categories": [...]
}
```

The file is created automatically on first run if it doesn't exist.

## Usage

1. **Configure Post Types**: Go to "Post Types" and create a new post type. Add fields with different types (text, textarea, richtext, image, gallery, date, etc.)

2. **Manage Categories**: Go to "Categories" to create and manage categories. Slugs are automatically generated and kept unique.

3. **Create Posts**: Go to "Posts", select a post type, and click "Add Post" to create content based on your configured post types.

