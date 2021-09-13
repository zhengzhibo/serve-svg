#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const Mustache = require('mustache');

const open = require('open');
const glob = require('glob');

const app = new Koa();

app.use(require('koa-static')(process.cwd()));

function getSvgFiles() {
  return new Promise((resolve, reject) => {
    glob('**/*.svg', function (err, files) {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
}

// response
app.use(async (ctx) => {
  const files = await getSvgFiles();
  const path = process.cwd();

  const template = render('index', { files, path });

  ctx.body = template;
});

function render(pathname, data) {
  const template = fs.readFileSync(path.join(__dirname, './view/', pathname + '.html'), 'utf-8');
  return Mustache.render(template, data);
}

app.listen(3000);
console.log('serve-svg running: http://localhost:3000');
!process.env.NODE_ENV && open('http://localhost:3000');
