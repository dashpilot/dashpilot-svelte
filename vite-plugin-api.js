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

      // Handle API saves - expects all data (postTypes, posts, categories)
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
            
            // Expect payload to contain all data: { postTypes: [], posts: [], categories: [] }
            const allData = {
              postTypes: payload.postTypes || [],
              posts: payload.posts || [],
              categories: payload.categories || []
            };

            if (writeData(allData)) {
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

