import path from 'node:path';
import http from 'node:http';
import express from 'express';
import backgroundRemoval from '@imgly/background-removal-node';

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

const port = process.env.PORT || 5432;

//

// start http server
const app = express();
app.use(express.static(path.join(process.cwd(), './public')));
app.options('*', (req, res) => {
  res.set(headerObjects);
  res.end();
});
app.post('*', (req, res) => {
  const buffers = [];
  req.on('data', d => {
    buffers.push(d);
  });
  req.on('end', async () => {
    const b = Buffer.concat(buffers);
    const blob = new Blob([
      b,
    ], {
      type: 'image/png',
    });
    try {
      const blob2 = await backgroundRemoval(blob, {
        // publicPath,
        // debug: true,
        // progress: (key, current, total) => {
        //   console.log(`Downloading ${key}: ${current} of ${total}`);
        // },
        output: {
          // format: 'image/png' | 'image/jpeg' | 'image/webp'; // The output format. (Default "image/png")
          quality: 1,
          // type: 'foreground' | 'background' | 'mask'; // The output type. (Default "foreground")
        },
      });
      const arrayBuffer2 = await blob2.arrayBuffer();
      const buffer2 = Buffer.from(arrayBuffer2);

      res.set(headerObjects);
      res.set('Content-Type', 'image/png');
      res.end(buffer2);
    } catch(err) {
      res.status(500);
      res.set(headerObjects);
      // res.set('Content-Type', 'image/png');
      res.end(err.stack);
    }
  });
});

http.createServer(app)
  .listen(port, () => {
    console.log(`Running: server listening on port ${port}`);
  });