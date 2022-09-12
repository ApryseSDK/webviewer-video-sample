import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer } from '@pdftron/webviewer-video';
import './App.css';
import {
  Waveform,
  initializeAudioViewer
} from '@pdftron/webviewer-audio';
import {
  demoXFDFString,
} from './constants/demo-vars';

const App = () => {
  const viewer = useRef(null);
  const inputFile = useRef(null);
  const [state, setState] = useState({ instance: null, videoInstance: null, audioInstance: null });

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        enableRedaction: process.env.DEMO ? true : false,
      },
      viewer.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;
      let currentVideoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/bunny-short.mp4';

      const audioInstance = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: Waveform,
          isDemoMode: process.env.DEMO,
          enableRedaction: process.env.DEMO ? true : false,
        }
      );

      instance.setTheme('dark');

      setState({ instance, videoInstance, audioInstance });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance.loadVideo(currentVideoUrl);
      initializeHeader(instance);

      videoInstance.UI.updateElement('redactApplyButton', {
        onClick: async redactAnnotations => {
          const socket = new WebSocket('wss://dya2mxwl63.execute-api.us-west-2.amazonaws.com/production');
          await new Promise(async (resolve, reject) => {
            socket.onmessage = event => {
              const data = JSON.parse(event.data);
              // response do something
              if (data.statusCode === 200) {
                currentVideoUrl = data.body;
                videoInstance.loadVideo(data.body, {
                  fileName: 'myvideo.mp4',
                });
                resolve();
              } else {
                // either endpoint timeout issue or a different error occurred
                if (data && data.message === 'Endpoint request timed out') {
                  // ignore this error. Lambda seems to work fine even when it happens.
                } else {
                  reject('Something went wrong with redaction endpoint', data);
                  console.error('Something went wrong with redaction endpoint', data);
                }
              }
            };
            await new Promise(resolve => {
              socket.onopen = () => {
                resolve();
              };
            });
            const message = {
              'action': 'video-redact',
              'intervals': [],
              'url': currentVideoUrl,
            };
            redactAnnotations.forEach(redactionAnnot => {
              const { redactionType } = redactionAnnot;
              const startTime = parseFloat(redactionAnnot.getCustomData('trn-video-start-time'));
              const endTime = parseFloat(redactionAnnot.getCustomData('trn-video-end-time'));
              const shouldRedactAudio = redactionAnnot.getCustomData('trn-redact-audio') === 'true';

              message.intervals.push({
                startTime,
                endTime,
                shouldRedactAudio: shouldRedactAudio || redactionType === 'audioRedaction',
                shouldRedactVideo: redactionType !== 'audioRedaction',
              });
            });
            socket.send(JSON.stringify(message));
          });
        }
      });

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      if (process.env.DEMO) {
        // Load saved annotations
        docViewer.addEventListener(
          'videoElementReady',
          async () => {
            const video = videoInstance.getVideo();
            const xfdfString = demoXFDFString;
            await annotManager.importAnnotations(xfdfString);
            video.updateAnnotationsToTime(0);
          },
          { once: true },
        );
      }
    });
  }, []);

  const onFileChange = async event => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    const { instance, videoInstance, audioInstance } = state;

    // Seamlessly switch between PDFs and videos.
    // Can also detect by specific video file types (ie. mp4, ogg, etc.)
    if (file.type.includes('video') ||
      (file.name.includes('.mpd') && file.type === '')
    ) {
      videoInstance.loadVideo(url, { fileName: file.name });
      // TODO: Notespanel needs to be delayed when opening. Not sure why.
      setTimeout(() => {
        instance.openElements('notesPanel');
      });
    } else if (file.type.includes('audio')) {
      audioInstance.loadAudio(url, { fileName: file.name });

      setTimeout(() => {
        instance.openElements('notesPanel');
      });
    } else {
      instance.setToolMode('AnnotationEdit');
      instance.loadDocument(url);
    }
  };

  function initializeHeader(instance) {
    const { setHeaderItems } = instance;

    setHeaderItems(header => {
      // Add upload file button
      header.push({
        type: 'actionButton',
        img: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 15H13V9H16L12 4L8 9H11V15Z" fill="currentColor"/>
        <path d="M20 18H4V11H2V18C2 19.103 2.897 20 4 20H20C21.103 20 22 19.103 22 18V11H20V18Z" fill="currentColor"/>
        </svg>`,
        title: 'Load file',
        dataElement: 'audio-loadFileButton',
        onClick: () => {
          inputFile.current.click();
        }
      });
    });
  }

  return (
    <div className="App">
      <input type="file" hidden ref={inputFile} onChange={onFileChange} value=""/>
      <div className="webviewer" ref={viewer}/>
    </div>
  );
};

export default App;
