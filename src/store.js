import { writable } from 'svelte/store';

// Available field types
export const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'richtext', label: 'Rich Text' },
  { value: 'image', label: 'Image' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'category', label: 'Category' },
  { value: 'checkbox', label: 'Checkbox' }
];

// Content types configuration
export const contentTypes = writable([]);

// Content data
export const content = writable([]);

// Categories
export const categories = writable([]);

