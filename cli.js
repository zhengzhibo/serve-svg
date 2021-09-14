#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Koa = require('koa');
const Mustache = require('mustache');

const commander = require('commander');
const program = new commander.Command();
const open = require('open');
const glob = require('glob');
const { version } = require('./package.json');

const app = new Koa();

function myParseInt(value, dummyPrevious) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}

program.version(version);

program
  .argument('[cwd]', 'working folder path')
  .option('-d, --debug', 'output extra debugging')
  .option('-r, --recursive', 'serve file recursive')
  .option('-g, --glob <string>', 'use glob pattern')
  .option('-l, --limit <number>', 'limit the quantity of svg files')
  .option('--no-open', 'no open browser')
  .option('-p, --port <number>', 'specify custom port', myParseInt, 3000);

program.parse(process.argv);

const options = program.opts();
if (options.debug) console.log(options);

const pattern = options.glob || (options.recursive ? '**/*.svg' : '*.svg');
const cwd = program.args[0] || process.cwd();

app.use(require('koa-static')(cwd));

function getSvgFiles() {
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd }, function (err, files) {
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
  let paths = await getSvgFiles();
  if (options.limit) {
    paths = paths.slice(0, options.limit);
  }

  const files = paths.map(p => {
    const stat = fs.statSync(path.join(cwd, p))
    return {
      path: p,
      name: p.split(/(\\|\/)/g).pop()
    }
  })


  const template = render('index', { files, cwd });

  ctx.body = template;
});

function render(pathname, data) {
  const template = fs.readFileSync(path.join(__dirname, './view/', pathname + '.html'), 'utf-8');
  return Mustache.render(template, data);
}

app.listen(options.port);
console.log(`serve-svg running: http://localhost:${options.port}`);
options.open && !process.env.NODE_ENV && open(`http://localhost:${options.port}`);
