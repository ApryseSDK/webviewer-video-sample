import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer } from '@pdftron/webviewer-video';
import './App.css';
import {
  Waveform,
  initializeAudioViewer
} from '@pdftron/webviewer-audio';
import {
  demoPeaks,
  demoXFDFString,
} from './constants/demo-vars';

const DOCUMENT_ID = 'video';

const App = () => {
  const viewer = useRef(null);
  const inputFile = useRef(null);
  const [ wvInstance, setInstance ] = useState(null);
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
      } = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: Waveform,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks
        }
      );

      instance.openElements('notesPanel');
      instance.setTheme('dark');

      setInstance(instance);

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      // A unique fileId should be generated for each url for audio caching to work properly
      loadVideo(videoUrl, { fileId: 'testId' });
      initializeHeader(instance);

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      // Load saved annotations
      docViewer.on('documentLoaded', async () => {
        const document = docViewer.getDocument();
        let video;
        let xfdfString;

        if (document.type === 'video') {
          video = document.getVideo();
        }
        
        if (process.env.DEMO && document.type !== 'audio') {
          xfdfString = demoXFDFString;
        } else if (!process.env.DEMO) {
          const loadXfdfString = documentId => {
            return new Promise(resolve => {
              fetch(`/server/annotationHandler.js?documentId=${documentId}`, {
                method: 'GET'
              }).then(response => {
                if (response.status === 200) {
                  response.text()
                    .then(xfdfString => {
                      resolve(xfdfString);
                    });
                } else if (response.status === 204) {
                  console.warn(`Found no content in xfdf file /server/annotationHandler.js?documentId=${documentId}`);
                  resolve('');
                } else {
                  console.warn(`Something went wrong trying to load xfdf file /server/annotationHandler.js?documentId=${documentId}`);
                  console.warn(`Response status ${response.status}`);
                  resolve('');
                }
              });
            });
          };

          // Make a GET request to get XFDF string
          xfdfString = await loadXfdfString(DOCUMENT_ID);
        }

        if (xfdfString) {
          await annotManager.importAnnotations(xfdfString);
          video && video.updateAnnotationsToTime(0);
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
      const {
        loadVideo
      } = await initializeVideoViewer(
        wvInstance,
        {
          license,
          AudioComponent: Waveform
        },
      );

      loadVideo
      (
        url,
        {
          fileName: file.name,
          fileId: file.name,
        }
      );
      // TODO: Notespanel needs to be delayed when opening. Not sure why.
      setTimeout(() => {
        wvInstance.openElements('notesPanel');
      });
    } else if (file.type.includes('audio')) {
      const {
        loadAudio,
      } = await initializeAudioViewer(
        wvInstance,
        { license },
      );

      loadAudio(url);
      
      setTimeout(() => {
        wvInstance.openElements('notesPanel');
      });
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
