import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer, renderControlsToDOM } from '@pdftron/webviewer-video';
import './App.css';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

const App = () => {
  const viewer = useRef(null);
  const [ internetExplorerCheck, setInternetExplorerCheck ] = useState(false);
  const [ wvInstance, setWVInstance ] = useState(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {

    console.log('I HAVE BEEN RENDERED');
    if (window.document.documentMode) {
      setInternetExplorerCheck(true);
      return;
    }

    WebViewer(
      {
        path: '/webviewer/lib',
        selectAnnotationOnCreation: true,
      },
      viewer.current,
    ).then(async instance => {
      setWVInstance(instance);

      // safari check due to a bug in webviewer
      !isSafari && instance.openElements('notesPanel');

      const { docViewer } = instance;

      await loadSampleVideo(instance);

      // Load saved annotations
      docViewer.on('documentLoaded', () => {
        const docType = docViewer.getDocument().getType();

        console.log('documentLoaded', docType);

        if (docType === 'video') {
          const customContainer = instance.iframeWindow.document.querySelector('.custom-container');
          renderControlsToDOM(instance, customContainer);
        }
      });
    });
  }, []);

  if (internetExplorerCheck) {
    return (
      <div>
        WebViewer Video does not support Internet Explorer.
      </div>
    );
  }

  async function loadSampleVideo(instance) {
    const license = `---- Insert commercial license key here after purchase ----`;
    // Extends WebViewer to allow loading HTML5 videos (.mp4, ogg, webm).
    const {
      loadVideo,
    } = await initializeVideoViewer(
      instance,
      license,
    );

    // Load a video at a specific url. Can be a local or public link
    // If local it needs to be relative to lib/ui/index.html.
    // Or at the root. (eg '/video.mp4')
    const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';
    loadVideo(videoUrl);
  }

  function onSelectChange(event) {
    if (event.target.value === 'PDF') {
      wvInstance.loadDocument('https://pdftron.s3.amazonaws.com/downloads/pl/demo-annotated.pdf');
    } else if (event.target.value === 'Video') {
      loadSampleVideo(wvInstance);
    }
  }

  return (
    <div className="App">
      <select onChange={onSelectChange}>
        <option>Video</option>
        <option>PDF</option>
      </select>
      <div className="webviewer" ref={viewer}/>
    </div>
  );
};

export default App;
