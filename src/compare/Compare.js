import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer } from '@pdftron/webviewer-video';
import '../App.css';
import {
  Waveform,
  initializeAudioViewer
} from '@pdftron/webviewer-audio';
import {
  demoPeaks,
  demoXFDFString,
} from '../constants/demo-vars';
import {
  createSyncButton,
  initCompareViewer,
  switchActiveInstance
} from '../functions/initCompareViewer';
import {
  setUpParentViewer,
  onParentDocumentLoaded,
} from '../functions/setUpParentViewer';

const CompareApp = () => {
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
    const {
      instance1,
      instance2,
      parentInstance,
      videoInstance1,
      videoInstance2
    } = state;

    if (parentInstance && instance1 && instance2) {
      setUpParentViewer(state, parentWrapper, activeInstance);
      createSyncButton({ 
        mainInstance: instance1,
        mainVideoInstance: videoInstance1,
        secondaryInstance: instance2,
        secondaryVideoInstance: videoInstance2,
      });
      createSyncButton({
        mainInstance: instance2,
        mainVideoInstance: videoInstance2,
        secondaryInstance: instance1,
        secondaryVideoInstance: videoInstance1,
      });
    }
  }, [state, activeInstance, parentWrapper]);

  useEffect(() => {
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
          isCompare: true,
          showAnnotationPreview: false,
          hideOutOfRangeAnnotations: false,
          AudioComponent: Waveform,
          showFrames: false,
          showTooltipPreview: false,
        }
      );

      instance.setTheme('dark');

      // We load a dummy video here to be able to load annotations into parent webviewer instance
      videoInstance3.loadVideo('https://pdftron.s3.amazonaws.com/downloads/pl/video/blank-0.2-sec.m4v');
      setState(prevState => ({ ...prevState, parentInstance: instance }));

      instance.docViewer.addEventListener(
        'documentLoaded',
        onParentDocumentLoaded(instance, parentWrapper, compareContainer),
      );
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
          isCompare: true,
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
          isCompare: true,
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
      // eslint-disable-next-line no-empty-pattern
      let {} = {
        instance1: instance,
        videoInstance1: videoInstance,
        audioInstance1: audioInstance
      } = state;
    } else {
      // eslint-disable-next-line no-empty-pattern
      let {} = {
        instance2: instance,
        videoInstance2: videoInstance,
        audioInstance2: audioInstance
      } = state;
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
        <div className="webviewer-overlay" onClick={() => switchActiveInstance({ state, overlayWrapper, activeInstance, setActiveInstance })} ref={overlayWrapper}></div>
      </div>
    </div>
  );
};

export default CompareApp;
