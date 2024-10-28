import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer } from '@pdftron/webviewer-video';
import './App.css';
import {
  initializeAudioViewer
} from '@pdftron/webviewer-audio';
import {
  demoPeaks,
  demoXFDFString,
} from './constants/demo-vars';

const App = () => {
  const viewer = useRef(null);
  const inputFile = useRef(null);
  const [state, setState] = useState({ instance: null, videoInstance: null, audioInstance: null });

  useEffect(() => {
    WebViewer.Iframe(
      {
        path: '/webviewer/lib',
        enableRedaction: process.env.DEMO ? true : false,
      },
      viewer.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;
      const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';

      const audioInstance = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: audioInstance.Waveform,
          isDemoMode: process.env.DEMO,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks, // waves can be pre-generated as seen here for fast loading: https://github.com/bbc/audiowaveform
          enableRedaction: process.env.DEMO ? true : false,
        }
      );

      instance.UI.setTheme('dark');

      setState({ instance, videoInstance, audioInstance });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance.loadVideo(videoUrl);
      initializeHeader(instance);

      if (process.env.DEMO) {
        const { documentViewer } = instance.Core;
        const annotManager = documentViewer.getAnnotationManager();
        // Load saved annotations
        documentViewer.addEventListener(
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
        instance.UI.openElements('notesPanel');
      });
    } else {
      instance.UI.setToolMode('AnnotationEdit');
      instance.UI.loadDocument(url);
    }
  };

  function initializeHeader(instance) {
    const { setHeaderItems } = instance.UI;

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
