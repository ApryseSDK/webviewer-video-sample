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
import { initCompareViewer } from './functions/initCompareViewer';

// Maybe convert to global state later
let globalInstance1;
let globalInstance2;

const App = () => {
  const parentViewer = useRef(null);
  const viewer1 = useRef(null);
  const viewer2 = useRef(null);
  const inputFile = useRef(null);
  const compareContainer = useRef(null);
  const parentWrapper = useRef(null);
  const overlayWrapper = useRef(null);
  const [state, setState] = useState({
    parentInstance: null,
    instance1: null,
    instance2: null,
    videoInstance1: null,
    videoInstance2: null,
    audioInstance1: null,
    audioInstance2: null,
  });

  const [ activeInstance, setActiveInstance ] = useState(1);

  useEffect(() => {
    const setDisplayTheme = e => {
      const { instance1, instance2 } = state;
      instance1.UI.setTheme(e.detail);
      instance2.UI.setTheme(e.detail);
    };

    const onToolUpdate = e => {
      const instance1ToolModeMap = instance1.docViewer.getToolModeMap();
      const instance2ToolModeMap = instance2.docViewer.getToolModeMap();

      instance1ToolModeMap[e.name] && instance1ToolModeMap[e.name].setStyles(e.defaults);
      instance2ToolModeMap[e.name] && instance2ToolModeMap[e.name].setStyles(e.defaults);
    };

    const onToolModeUpdate = e => {
      instance1.UI.setToolMode(e.name);
      instance2.UI.setToolMode(e.name);
    };

    const onAnnotationChanged = instance => {
      const parentAnnotManager = parentInstance.docViewer.getAnnotationManager();

      return async () => {
        if (activeInstance === instance) {
          const annotManager = instance === 1 
            ? instance1.docViewer.getAnnotationManager()
            : instance2.docViewer.getAnnotationManager();

          let newAnnotations = await annotManager.exportAnnotations();
          parentAnnotManager.deleteAnnotations(parentAnnotManager.getAnnotationsList());
          parentAnnotManager.importAnnotations(newAnnotations);
        }
      };
    };

    const onZoomUpdated = newZoomLevel => {
      instance1.UI.setZoomLevel(newZoomLevel);
      instance2.UI.setZoomLevel(newZoomLevel);
    };

    const setUpParentViewer = () => {
      parentInstance.disableElements([
        'downloadButton',
        'selectToolButton',
      ]);

      setDisplayTheme({ detail: parentInstance.UI.selectors.getActiveTheme() });
      parentInstance.iframeWindow.addEventListener('themeChanged', setDisplayTheme);
      parentInstance.docViewer.addEventListener('toolUpdated', onToolUpdate);
      parentInstance.docViewer.addEventListener('toolModeUpdated', onToolModeUpdate);
      parentInstance.docViewer.addEventListener('zoomUpdated', onZoomUpdated);
      
      const instance1AnnotManager = instance1.docViewer.getAnnotationManager();
      const instance2AnnotManager = instance2.docViewer.getAnnotationManager();

      const onAnnotationChangedInstance1 = onAnnotationChanged(1);
      const onAnnotationChangedInstance2 = onAnnotationChanged(2);

      instance1AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance1);
      instance2AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance2);

      return () => {
        parentInstance.iframeWindow.removeEventListener('themeChanged', setDisplayTheme);
        parentInstance.docViewer.removeEventListener('toolUpdated', onToolUpdate);
        parentInstance.docViewer.removeEventListener('toolModeUpdated', onToolModeUpdate);
        parentInstance.docViewer.removeEventListener('zoomUpdated', onZoomUpdated);


        const instance1AnnotManager = instance1.docViewer.getAnnotationManager();
        const instance2AnnotManager = instance2.docViewer.getAnnotationManager();
  
        instance1AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance1);
        instance2AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance2);
      };
    };

    const { instance1, instance2, parentInstance } = state;

    if (parentInstance && instance1 && instance2) {
      setUpParentViewer(parentInstance);

    }
  }, [state, activeInstance]);

  useEffect(() => {
    const createSyncButton = instance => {
      const { setHeaderItems, updateElement } = instance;
      let isSynced = false;
      let syncingVideo;
    
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
          dataElement: 'syncPlaybackButton',
          onClick: () => {
            isSynced = !isSynced;
            updateElement('syncPlaybackButton', {
              className: `${ isSynced ? 'active' : ''}`
            });

            const video1 = globalInstance1.getVideo();
            const video2 = globalInstance2.getVideo();

            // TODO: Move the mute elsewhere, should probably set up compare after initialization
            video1.setMuted(true);
            video2.setMuted(true);

            const onPlay = video => {
              return () => {
                if (isSynced) {
                  video.getElement().play();
                }
              };
            };

            const onPause = (pausedVideo, videoToPause) => {
              return () => {
                if (isSynced) {
                  videoToPause.getElement().pause();
                  videoToPause.goToTime(pausedVideo.getElement().currentTime);
                }
              };
            };

            const onSeeked = (seekedVideo, videoToSeek) => {
              return () => {
                if (!isSynced) {
                  return;
                }

                if (syncingVideo !== videoToSeek) {
                  syncingVideo = seekedVideo;
                  
                  seekedVideo.getElement().pause();
                  videoToSeek.getElement().pause();

                  videoToSeek.goToTime(seekedVideo.getElement().currentTime);
                } else {
                  syncingVideo = null;
                }
              };
            };

            if (isSynced) {
              video1.getElement().pause();
              video2.getElement().pause();

              video2.goToTime(video1.getElement().currentTime);
              video1.getElement().onplay = onPlay(video2);
              video2.getElement().onplay = onPlay(video1);
              video1.getElement().onpause = onPause(video1, video2);
              video2.getElement().onpause = onPause(video2, video1);
              video1.getElement().onseeked = onSeeked(video1, video2);
              video2.getElement().onseeked = onSeeked(video2, video1);
            }
          }
        });
      });
    };

    // Parent 
    WebViewer(
      {
        path: '/webviewer/lib',
        autoFocusReplyInputOnAnnotationSelect: false,
        selectAnnotationOnCreation: true,
        css: '/Compare.css',
      },
      parentViewer.current,
    ).then(async instance => {
      const license = `---- Insert commercial license key here after purchase ----`;

      await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance3 = await initializeVideoViewer(
        instance,
        {
          license,
          showAnnotationPreview: false,
          hideOutOfRangeAnnotations: false,
          AudioComponent: Waveform,
        }
      );

      instance.setTheme('dark');

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')

      // Need to load a dummy video here to be able to load annotations (find empty video)
      videoInstance3.loadVideo('/input.mp4');
      createSyncButton(instance);
      setState(prevState => ({ ...prevState, parentInstance: instance }));

      const { docViewer } = instance;
      const onDocumentLoaded = () => {
        const toolsContainer = instance.iframeWindow.document.querySelector('.tools-container')        
        const toolsContainerCallback = mutationList => {
          mutationList.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              if (mutation.target.classList.contains('is-styling-open')) {
                parentWrapper.current.style.zIndex = 2;
              } else {
                parentWrapper.current.style.zIndex = 0;
              }
            }
          });
        };
        
        const observer = new MutationObserver(toolsContainerCallback);
        observer.observe(toolsContainer, { attributes: true });
        

        const parentContainer = instance.iframeWindow.document.querySelector('.document-content-container');

        parentContainer.ontransitionstart = () => {
          compareContainer.current.style.width = `${parentContainer.clientWidth}px`;
        };

        parentContainer.ontransitionend = () => {
          compareContainer.current.style.width = `${parentContainer.clientWidth}px`;
        };

        instance.iframeWindow.onresize = () => {
          compareContainer.current.style.width = `${parentContainer.clientWidth}px`;
        };
      };
      
      docViewer.addEventListener('documentLoaded', onDocumentLoaded);
    });

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
      initCompareViewer(instance);

      setState(prevState => ({ ...prevState, instance1: instance, videoInstance1, audioInstance1 }));

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
          video.setMuted(true);
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
      initCompareViewer(instance);

      setState(prevState => ({ ...prevState, instance2: instance, videoInstance2, audioInstance2 }));

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
  }, []);

  const onFileChange = async event => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);

    let instance, videoInstance, audioInstance;

    if (activeInstance === 1) {
      instance = state.instance1;
      videoInstance = state.videoInstance1;
      audioInstance = state.audioInstance1;
    } else {
      instance = state.instance2;
      videoInstance = state.videoInstance2;
      audioInstance = state.audioInstance2;
    }

    // Seamlessly switch between PDFs and videos.
    // Can also detect by specific video file types (ie. mp4, ogg, etc.)
    if (file.type.includes('video')) {
      videoInstance.loadVideo(url, { fileName: file.name, });
    } else if (file.type.includes('audio')) {
      audioInstance.loadAudio(url);
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

  const switchActiveInstance = async () => {
    let annotManager;
    const {
      parentInstance: { docViewer },
      instance1: { docViewer: instance1DocViewer },
      instance2: { docViewer: instance2DocViewer },
    } = state;

    if (activeInstance === 1) {
      setActiveInstance(2);
      overlayWrapper.current.style.left = 'unset';
      const { instance2 } = state;

      annotManager = instance2.docViewer.getAnnotationManager();
      instance1DocViewer.getAnnotationManager().deselectAllAnnotations();
    } else {
      setActiveInstance(1);
      overlayWrapper.current.style.left = '50%';
      const { instance1 } = state;  

      annotManager = instance1.docViewer.getAnnotationManager();
      instance2DocViewer.getAnnotationManager().deselectAllAnnotations();
    }

    let annotations = await annotManager.exportAnnotations();
    docViewer.getAnnotationManager().deleteAnnotations(
      docViewer.getAnnotationManager().getAnnotationsList()
    );
    docViewer.getAnnotationManager().importAnnotations(annotations);
  };

  // TODO:
  // When opening notes panel either copy elements into document content container
  // Have notes panel open on right side

  return (
    <div className="App">
      <input type="file" hidden ref={inputFile} onChange={onFileChange} value=""/>
      <div className="webviewer-parent-wrapper" ref={parentWrapper}>
        <div className="webviewer" ref={parentViewer}/>
      </div>

      <div className="compare-app" ref={compareContainer}>
        <div
          className={`webviewer-compare-wrapper ${activeInstance === 1 ? 'active-compare-wrapper ' : ''}`}
        >
          <div className="webviewer" ref={viewer1}/>
        </div>
        <div
          className={`webviewer-compare-wrapper ${activeInstance === 2 ? 'active-compare-wrapper ' : ''}`}
        >
          <div className="webviewer" ref={viewer2}/>
        </div>
        <div className="webviewer-overlay" onClick={() => switchActiveInstance()} ref={overlayWrapper}></div>
      </div>
    </div>
  );
};

export default App;
