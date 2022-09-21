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

  videoInstance.UI.updateElement('redactApplyButton', {
    onClick: async redactAnnotations => {
      const response = await fetch('http://localhost:3001/video/redact', {
        method: 'POST',
        body: JSON.stringify({
          intervals: redactAnnotations.map(annotation => ({
            start: annotation.getStartTime(),
            end: annotation.getEndTime(),
            shouldRedactAudio: annotation.shouldRedactAudio || annotation.redactionType === 'audioRedaction',
            shouldRedactVideo: annotation.redactionType !== 'audioRedaction',
          })),
          url: 'https://pdftron.s3.amazonaws.com/downloads/pl/video/bunny-short.mp4',
        }),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });

      const videoBuffer = await response.arrayBuffer();

      const newVideoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
      videoInstance.loadVideo(URL.createObjectURL(newVideoBlob));
      return videoBuffer;
    }
  });

  const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/bunny-short.mp4';
  videoInstance.loadVideo(videoUrl);
});
