import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import express from 'express';
// import backgroundRemoval from '@imgly/background-removal';
import backgroundRemoval from '@imgly/background-removal-node';

//

import {
  headers,
} from './background-remover.mjs';
// import handleFetch from './background-remover.mjs';

//

const port = process.env.PORT || 5432;
globalThis.navigator = {
  hardwareConcurrency: os.cpus().length,
};
// const publicPath = 'file://' + path.join(process.cwd(), './public/onnx/');
// console.log(publicPath);
const publicPath = 'http://127.0.0.1:' + port + '/onnx/';

//

// start http server
const app = express();
// app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(process.cwd(), './public')));
app.options('*', (req, res) => {
  res.set(headers);
  res.end();
});
app.post('*', (req, res) => {
  const buffers = [];
  req.on('data', d => {
    buffers.push(d);
  });
  req.on('end', async () => {
    const b = Buffer.concat(buffers);
    const blob = new Blob(buffers, {
      type: 'image/png',
    });
    const blob2 = await backgroundRemoval(blob, {
      // publicPath,
      // debug: true,
      // progress: (key, current, total) => {
      //   console.log(`Downloading ${key}: ${current} of ${total}`);
      // },
    });
    const arrayBuffer2 = await blob2.arrayBuffer();
    const buffer2 = Buffer.from(arrayBuffer2);

    res.set(headers);
    res.set('Content-Type', 'image/png');
    res.end(buffer2);
  });
});

http.createServer(app)
  .listen(port);