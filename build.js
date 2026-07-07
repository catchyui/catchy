const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

const entryPoint = path.resolve(__dirname, 'resources/js/catchy-modular.js');
const outFile = path.resolve(__dirname, 'resources/js/catchy.js');

async function build() {
 const ctx = await esbuild.context({
 entryPoints: [entryPoint],
 bundle: true,
 outfile: outFile,
 format: 'iife',
 target: ['es2020'],
 minify: isMinify,
 sourcemap: false,
 banner: {
 js: `/**\n * CatchyUI/Catchy - Alpine.js SPA Plugin v${require('./package.json').version}\n * (c) ${new Date().getFullYear()} CatchyUI\n * Released under the MIT License.\n */`
 },
 });

 if (isWatch) {
 await ctx.watch();
 console.log('Catchy: Watching for changes...');
 } else {
 await ctx.rebuild();
 await ctx.dispose();

 const stats = fs.statSync(outFile);
 const sizeKB = (stats.size / 1024).toFixed(1);
 console.log(`Catchy: Built  ${outFile} (${sizeKB} KB${isMinify ? ', minified' : ''})`);
 }
}

build().catch((e) => {
 console.error(e);
 process.exit(1);
});
