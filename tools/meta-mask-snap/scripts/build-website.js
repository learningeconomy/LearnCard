const { promises: fs } = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

main();

async function main() {
  const rootPath = path.resolve(__dirname, '../');
  const publicPath = path.join(rootPath, 'public/');
  const imagesPath = path.join(publicPath, 'images/');

  await mkdirp(imagesPath);
  await fs.copyFile(
    path.join(rootPath, 'images/icon.svg'),
    path.join(imagesPath, 'icon.svg'),
  );

  const htmlContents = await fs.readFile(
    path.join(rootPath, 'index.html'),
    'utf8',
  );
  await fs.writeFile(
    path.join(publicPath, 'index.html'),
    htmlContents.replace(
      // eslint-disable-next-line no-template-curly-in-string
      'const snapId = `local:${window.location.href}`;',
      'const snapId = `npm:@metamask/template-snap`;',
    ),
  );
}
