window.WebViewer(
  {
    path: '../../public/webviewer/lib/',
    enableRedaction: true,
  },
  document.getElementById('viewer'),
).then(async instance => {
  instance.setTheme('dark');
  const license = `---- Insert commercial license key here after purchase ----`;

  const { Waveform, initializeAudioViewer } = window.WebViewerAudio;
  await initializeAudioViewer(
    instance,
    { license },
  );

  const { initializeVideoViewer } = window.WebViewerVideo;
  const videoInstance = await initializeVideoViewer(
    instance,
    {
      license,
      AudioComponent: Waveform,
      enableRedaction: true,
    },
  );

  const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';
  videoInstance.loadVideo(videoUrl);
});
