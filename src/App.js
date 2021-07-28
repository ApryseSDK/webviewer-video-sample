import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer } from '@pdftron/webviewer-video';
import './App.css';
// import {
//   Waveform,
//   initializeAudioViewer
// } from '@pdftron/webviewer-audio';
import {
  demoPeaks,
  demoXFDFString,
} from './constants/demo-vars';

const App = () => {
  const viewer = useRef(null);
  const inputFile = useRef(null);
  const [ wvInstance, setInstance ] = useState(null);
  const [ wvLoadVideo, setWvLoadVideo ] = useState(null);
  const license = `---- Insert commercial license key here after purchase ----`;
  const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        selectAnnotationOnCreation: true,
        // Fix for ie11. It can't switch to dark mode so we do it manually.
        ...(window.document.documentMode && { css: '../../../styles.css' }),
      },
      viewer.current,
    ).then(async instance => {
      const {
        loadVideo,
        getVideo,
      } = await initializeVideoViewer(
        instance,
        {
          license,
          // AudioComponent: Waveform,
          showFrames: true,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks // waves can be pre-generated as seen here for fast loading: https://github.com/bbc/audiowaveform
        }
      );

      instance.openElements('notesPanel');
      instance.setTheme('dark');

      setInstance(instance);
      setWvLoadVideo( () => loadVideo);

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      loadVideo(videoUrl);
      initializeHeader(instance);

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      // Load saved annotations
      docViewer.on('documentLoaded', async () => {
        if (process.env.DEMO) {
          const video = getVideo();
          const xfdfString = demoXFDFString;
          await annotManager.importAnnotations(xfdfString);
          video.updateAnnotationsToTime(0);
        }
      });
    });
  }, [license]);

  async function onFileChange(event) {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    // Seamlessly switch between PDFs and videos.
    // Can also detect by specific video file types (ie. mp4, ogg, etc.)
    if (file.type.includes('video')) {
      // const {
      //   loadVideo
      // } = await initializeVideoViewer(
      //   wvInstance,
      //   {
      //     license,
      //     // AudioComponent: Waveform,
      //     showFrames: true,
      //   },
      // );

      // loadVideo
      // (
      //   url,
      //   {
      //     fileName: file.name,
      //   }
      // );
      wvLoadVideo(
        url,
        {
          fileName: file.name,
        }
      );
      // TODO: Notespanel needs to be delayed when opening. Not sure why.
      setTimeout(() => {
        wvInstance.openElements('notesPanel');
      });
    } else if (file.type.includes('audio')) {
      // const {
      //   loadAudio,
      // } = await initializeAudioViewer(
      //   wvInstance,
      //   { license },
      // );

      // loadAudio(url);

      // setTimeout(() => {
      //   wvInstance.openElements('notesPanel');
      // });
    } else {
      wvInstance.setToolMode('AnnotationEdit');
      wvInstance.loadDocument(url);
    }
  }

  function initializeHeader(instance) {
    const { setHeaderItems } = instance;

    // Add save annotations button
    setHeaderItems(header => {
      // Add upload file button
      header.push({
        type: 'actionButton',
        img: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 15H13V9H16L12 4L8 9H11V15Z" fill="currentColor"/>
        <path d="M20 18H4V11H2V18C2 19.103 2.897 20 4 20H20C21.103 20 22 19.103 22 18V11H20V18Z" fill="currentColor"/>
        </svg>`,
        title: 'Load file',
        dataElement: 'video-downloadFileButton',
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
