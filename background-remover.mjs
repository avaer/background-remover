// import path from 'node:path';
import backgroundRemoval from '@imgly/background-removal';

//

// const publicPath = path.join(__dirname, './onnx/');
// use import.meta.url instead of __dirname
// const publicPath = path.join(import.meta.url.replace(/(\/)[^\/\\]*$/, '$1'), './onnx/');
// const publicPath = './onnx/';

//

export const headers = [
  {
    "key": "Access-Control-Allow-Origin",
    "value": "*"
  },
  {
    "key": "Access-Control-Allow-Methods",
    "value": "*"
  },
  {
    "key": "Access-Control-Allow-Headers",
    "value": "*"
  },
  {
    "key": "Access-Control-Expose-Headers",
    "value": "*"
  },
  {
    "key": "Access-Control-Allow-Private-Network",
    "value": "true"
  }
];
const headerObjects = {};
for (const header of headers) {
  headerObjects[header.key] = header.value;
}

//

export default {
  async fetch(request, env, ctx) {
    console.log('got request', request.method, request.url);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: headerObjects,
      });
    } else if (request.method === 'POST') {
      // read the body as a blob
      const blob = await request.blob();
      const blob2 = await backgroundRemoval(blob, {
        // publicPath,
      });

      return new Response(blob2, {
        headers: {
          'Content-Type': 'image/png',
          ...headerObjects,
        },
      });
    } else {
      return new Response('invalid method', {
        status: 404,
      });
    }
  },
};