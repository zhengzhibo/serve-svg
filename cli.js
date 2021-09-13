#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const Mustache = require('mustache');

const commander  = require('commander');
const program = new commander.Command();
const open = require('open');
const glob = require('glob');
const {version} = require('./package.json');

const app = new Koa();
app.use(require('koa-static')(process.cwd()));

function myParseInt(value, dummyPrevious) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

program.version(version);

program
  .option('-d, --debug', 'output extra debugging')
  .option('-r, --recursive', 'serve file recursive')
  .option('-g, --glob <string>', 'use glob pattern', )
  .option('-p, --port <number>', 'specify custom port', myParseInt, 3000);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);

const pattern = options.glob || (options.recursive ? '**/*.svg' : '*.svg');

function getSvgFiles() {
  return new Promise((resolve, reject) => {
    glob(pattern, function (err, files) {
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

app.listen(options.port);
console.log(`serve-svg running: http://localhost:${options.port}`);
!process.env.NODE_ENV && open(`http://localhost:${options.port}`);
