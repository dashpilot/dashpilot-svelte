// Generate a unique slug from a string
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Generate a unique slug that doesn't exist in the given array
export function generateUniqueSlug(text, existingItems, slugField = 'slug') {
  let baseSlug = generateSlug(text);
  let slug = baseSlug;
  let counter = 1;
  
  while (existingItems.some(item => item[slugField] === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

// Save data to API
export async function saveToAPI(endpoint, data) {
  // This is a placeholder - actual implementation should be done separately
  const response = await fetch(`/api/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save: ${response.statusText}`);
  }
  
  return response.json();
}

