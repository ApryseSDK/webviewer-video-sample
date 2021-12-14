const fs = require('fs-extra');

const copyFiles = async () => {
  try {
    await fs.copy('./node_modules/@pdftron/webviewer/public', './public/webviewer/lib');
    await fs.copy('./node_modules/@pdftron/webviewer-video/src/lib/api/ServiceWorker/wv-video-injection.js', './public/wv-video-injection.js');
    fs.copySync('./node_modules/@pdftron/webviewer-video/src/lib/api/ffprobe', './public/ffprobe');
    console.log('WebViewer files copied over successfully');
  } catch (err) {
    console.error(err);
  }
};

copyFiles();
