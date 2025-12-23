import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, 'data.json');

function ensureDataFile() {
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify({
      postTypes: [],
      posts: [],
      categories: []
    }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  try {
    const content = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading data.json:', error);
    return {
      postTypes: [],
      posts: [],
      categories: []
    };
  }
}

function writeData(data) {
  ensureDataFile();
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing data.json:', error);
    return false;
  }
}

export function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      // Serve data.json
      server.middlewares.use('/data.json', (req, res, next) => {
        if (req.method === 'GET') {
          ensureDataFile();
          const data = readData();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }
        next();
      });

      // Handle API saves
      server.middlewares.use('/api/save', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          try {
            const payload = JSON.parse(body);
            const data = readData();

            if (payload.type === 'post') {
              if (payload.action === 'delete') {
                data.posts = data.posts.filter(p => p.id !== payload.data.id);
              } else {
                const existingIndex = data.posts.findIndex(p => p.id === payload.data.id);
                if (existingIndex >= 0) {
                  data.posts[existingIndex] = payload.data;
                } else {
                  data.posts.push(payload.data);
                }
              }
            } else if (payload.type === 'category') {
              if (payload.action === 'delete') {
                data.categories = data.categories.filter(c => c.slug !== payload.data.slug);
              } else {
                const existingIndex = data.categories.findIndex(c => c.slug === payload.data.slug);
                if (existingIndex >= 0) {
                  data.categories[existingIndex] = payload.data;
                } else {
                  data.categories.push(payload.data);
                }
              }
            } else if (payload.type === 'postType') {
              if (payload.action === 'delete') {
                data.postTypes = data.postTypes.filter(pt => pt.slug !== payload.data.slug);
              } else {
                const existingIndex = data.postTypes.findIndex(pt => pt.slug === payload.data.slug);
                if (existingIndex >= 0) {
                  data.postTypes[existingIndex] = payload.data;
                } else {
                  data.postTypes.push(payload.data);
                }
              }
            }

            if (writeData(data)) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true }));
            } else {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Failed to save data' }));
            }
          } catch (error) {
            console.error('Error processing API request:', error);
            res.statusCode = 400;
            res.end(JSON.stringify({ error: error.message }));
          }
        });
      });
    }
  };
}

