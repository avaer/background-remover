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

const port = process.env.PORT || 4444;

//

// start http server
const app = express();
app.use(express.static(path.join(process.cwd(), './public')));
app.options('*', (req, res) => {
  res.set(headerObjects);
  res.end();
});
app.post('*', (req, res) => {
  const contentType = req.headers['content-type'] || 'image/png';
  const format = req.headers['format'] || 'image/webp'; // 'image/png' | 'image/jpeg' | 'image/webp'; // The output format. (Default "image/png")
  const quality = parseFloat(req.headers['quality'] || '') || undefined; // 0-1; default: 0.8
  const type = req.headers['type']; // 'foreground' | 'background' | 'mask'; // The output type. (Default "foreground")

  const buffers = [];
  let uploadSize = 0;
  const maxUploadSize = 25 * 1024 * 1024; // 25 MB
  const ondata = d => {
    uploadSize += d.length;
    if (uploadSize <= maxUploadSize) {
      buffers.push(d);
    } else {
      // gc optimization
      buffers.length = 0;
      cleanup();

      res.status(400);
      res.set(headerObjects);
      // res.set('Content-Type', 'image/png');
      res.end(JSON.stringify({
        error: `upload overflow; limit = ${maxUploadSize}`,
      }));
    }
  };
  req.on('data', ondata);
  const onend = async () => {
    let blob = new Blob(buffers, {
      type: contentType,
    });

    // gc optimization
    buffers.length = 0;
    cleanup();

    try {
      let blob2 = await backgroundRemoval(blob, {
        // publicPath,
        // debug: true,
        // progress: (key, current, total) => {
        //   console.log(`Downloading ${key}: ${current} of ${total}`);
        // },
        output: {
          format,
          quality,
          type,
        },
      });
      // blob = null;
      const arrayBuffer2 = await blob2.arrayBuffer();
      // blob2 = null;
      const buffer2 = Buffer.from(arrayBuffer2);

      res.set(headerObjects);
      res.set('Content-Type', 'image/png');
      res.end(buffer2);
    } catch(err) {
      res.status(500);
      res.set(headerObjects);
      // res.set('Content-Type', 'image/png');
      res.end(JSON.stringify({
        error: err.stack,
      }));
    }
  };
  req.on('end', onend);

  const cleanup = () => {
    req.removeListener('data', ondata);
    req.removeListener('end', onend);
  };
});

http.createServer(app)
  .listen(port, () => {
    console.log(`Running: server listening on port ${port}`);
  });