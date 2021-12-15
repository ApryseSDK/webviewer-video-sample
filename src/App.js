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

// Maybe convert to global state later
let globalInstance1;
let globalInstance2;

const App = () => {
  const parentViewer = useRef(null);
  const viewer1 = useRef(null);
  const viewer2 = useRef(null);
  const inputFile = useRef(null);
  const [state, setState] = useState({ instance: null, videoInstance1: null, videoInstance2: null, audioInstance1: null, audioInstance2: null });

  useEffect(() => {
    const doStuffForCompare = (instance, videoInstance) => {
      instance.iframeWindow.frameElement.style.position = 'unset';
    
      instance.disableElements([
        'toggleNotesButton',
        'ribbons',
        'menuButton',
        'audio-loadFileButton',
        'MergeAnnotationsTool',
        'toolsHeader',
        'notesPanel',
      ]);
    
      const { setHeaderItems } = instance;
      let isSynced = false;
    
      // Add save annotations button
      setHeaderItems(header => {
        // Add upload file button
        header.push({
          type: 'actionButton',
          img: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M9 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18H9V16H5V8H9V6ZM15 16H19V8H15V6H20C20.5523 6 21 6.44772 21 7V17C21 17.5523 20.5523 18 20 18H15V16Z" fill="currentColor"/>
          <path d="M12.5 7L8 10.75V3.25L12.5 7Z" fill="currentColor"/>
          <path d="M11.25 17L15.75 20.75V13.25L11.25 17Z" fill="currentColor"/>
          </svg>`,
          title: 'Sync Playback',
          dataElement: 'syncPlayback',
          onClick: () => {
            isSynced = !isSynced;

            const onPlay = () => {
              globalInstance1.getVideo().getElement().play();
              globalInstance2.getVideo().getElement().play();
            };

            const onPause = () => {
              globalInstance1.getVideo().getElement().pause();
              globalInstance2.getVideo().getElement().pause();
            };

            const onSeeked = () => {
              globalInstance1.getVideo().getElement().pause();
              globalInstance2.getVideo().getElement().pause();

              if (globalInstance1.getVideo().getElement().currentTime !== videoInstance.getVideo().getElement().currentTime) {
                globalInstance1.getVideo().goToTime(videoInstance.getVideo().getElement().currentTime);
              }

              if (globalInstance2.getVideo().getElement().currentTime !== videoInstance.getVideo().getElement().currentTime) {
                globalInstance2.getVideo().goToTime(videoInstance.getVideo().getElement().currentTime);
              }
            };

            if (isSynced) {
              videoInstance.getVideo().getElement().pause();

              if (videoInstance === globalInstance1) {
                globalInstance2.getVideo().goToTime(videoInstance.getVideo().getElement().currentTime);
                videoInstance.getVideo().getElement().onplay = onPlay;
                globalInstance2.getVideo().getElement().onplay = onPlay;
                videoInstance.getVideo().getElement().onpause = onPause;
                globalInstance2.getVideo().getElement().onpause = onPause;
                videoInstance.getVideo().getElement().onseeked = onSeeked;
                globalInstance2.getVideo().getElement().onseeked = onSeeked;
              } else {
                globalInstance1.getVideo().goToTime(videoInstance.getVideo().getElement().currentTime);
                videoInstance.getVideo().getElement().onplay = onPlay;
                globalInstance1.getVideo().getElement().onplay = onPlay;
                videoInstance.getVideo().getElement().onpause = onPause;
                globalInstance1.getVideo().getElement().onpause = onPause;
                videoInstance.getVideo().getElement().onseeked = onSeeked;
                globalInstance1.getVideo().getElement().onseeked = onSeeked;
              }
            }
          }
        });
      });
    };

    // First Compare
    WebViewer(
      {
        path: '/webviewer/lib',
        autoFocusReplyInputOnAnnotationSelect: false,
        selectAnnotationOnCreation: true,
      },
      viewer1.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;
      const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';

      const audioInstance1 = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance1 = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: Waveform,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks // waves can be pre-generated as seen here for fast loading: https://github.com/bbc/audiowaveform
        }
      );

      instance.setTheme('dark');
      doStuffForCompare(instance, videoInstance1);

      setState({ instance, videoInstance1, audioInstance1 });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance1.loadVideo(videoUrl);
      initializeHeader(instance);
      globalInstance1 = videoInstance1;

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      if (process.env.DEMO) {
        // Load saved annotations
        const onDocumentLoaded = async () => {
          const video = videoInstance1.getVideo();
          const xfdfString = demoXFDFString;
          await annotManager.importAnnotations(xfdfString);
          video.updateAnnotationsToTime(0);
          docViewer.removeEventListener('documentLoaded', onDocumentLoaded);
        };
        docViewer.addEventListener('documentLoaded', onDocumentLoaded);
      }
    });

    // Second Compare
    WebViewer(
      {
        path: '/webviewer/lib',
        autoFocusReplyInputOnAnnotationSelect: false,
        selectAnnotationOnCreation: true,
      },
      viewer2.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;
      const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';

      const audioInstance2 = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance2 = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: Waveform,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks // waves can be pre-generated as seen here for fast loading: https://github.com/bbc/audiowaveform
        }
      );

      instance.setTheme('dark');
      doStuffForCompare(instance, videoInstance2);

      setState({ instance, videoInstance2, audioInstance2 });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance2.loadVideo(videoUrl);
      globalInstance2 = videoInstance2;
      initializeHeader(instance);

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      if (process.env.DEMO) {
        // Load saved annotations
        const onDocumentLoaded = async () => {
          const video = videoInstance2.getVideo();
          const xfdfString = demoXFDFString;
          await annotManager.importAnnotations(xfdfString);
          video.updateAnnotationsToTime(0);
          docViewer.removeEventListener('documentLoaded', onDocumentLoaded);
        };
        docViewer.addEventListener('documentLoaded', onDocumentLoaded);
      }
    });

    // // Parent 
    WebViewer(
      {
        path: '/webviewer/lib',
        autoFocusReplyInputOnAnnotationSelect: false,
        selectAnnotationOnCreation: true,
      },
      parentViewer.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;

      const audioInstance2 = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance2 = await initializeVideoViewer(
        instance,
        {
          license,
        }
      );

      instance.setTheme('dark');

      //setState({ instance, videoInstance2, audioInstance2 });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance2.loadVideo(null);
      globalInstance2 = videoInstance2;
      initializeHeader(instance);
    });
  }, []);

  const onFileChange = async event => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    const { instance, videoInstance, audioInstance } = state;

    // Seamlessly switch between PDFs and videos.
    // Can also detect by specific video file types (ie. mp4, ogg, etc.)
    if (file.type.includes('video')) {
      videoInstance.loadVideo(url, { fileName: file.name, });
      // TODO: Notespanel needs to be delayed when opening. Not sure why.
      setTimeout(() => {
        //instance.openElements('notesPanel');
      });
    } else if (file.type.includes('audio')) {
      audioInstance.loadAudio(url);

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
      {/* <div className="webviewer" ref={viewer}/> */}

      <div className="webviewer-parent-wrapper">
        <div className="webviewer" ref={parentViewer}/>
      </div>

      <div className="webviewer-compare-wrapper">
        <div className="webviewer" ref={viewer1}/>
      </div>
      <div className="webviewer-compare-wrapper">
        <div className="webviewer" ref={viewer2}/>
      </div>
    </div>
  );
};

export default App;
