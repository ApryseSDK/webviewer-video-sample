window.WebViewer(
  {
    path: '../../public/webviewer/lib/',
  },
  document.getElementById('viewer'),
).then(async instance => {
  instance.UI.setTheme('dark');
  const license = `---- Insert commercial license key here after purchase ----`;

  const { initializeVideoViewer } = window.WebViewerVideo;
  const videoInstance = await initializeVideoViewer(
    instance,
    {
      license,
    },
  );

  await videoInstance.UI.enableCompareMode();

  const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/bunny-short.mp4';
  videoInstance.loadVideo(videoUrl);

  window.addEventListener(
    'documentViewer2Ready',
    () => {
      videoInstance.UI.loadCompareVideoB(videoUrl);
    },
    { once: true },
  );
});
