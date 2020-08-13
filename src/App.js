import React, { useRef, useEffect, useState } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer, Controls } from '@pdftron/webviewer-video';
import './App.css';

const DOCUMENT_ID = 'video';

const App = () => {
  const viewer = useRef(null);
  const [ webViewerInstance, setWebViewerInstance ] = useState(null);
  const [ documentLoaded, setDocumentLoaded ] = useState(false);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        css: '/styles.css',
        disabledElements: [
          'searchButton',
          'pageNavOverlay',
          'viewControlsButton',
          'panToolButton',
          'underlineToolGroupButton',
          'strikeoutToolGroupButton',
          'highlightToolGroupButton',
          'squigglyToolGroupButton',
          'signatureToolButton',
          'leftPanel',
          'leftPanelButton',
          'toolbarGroup-Edit',
          'themeChangeButton',
        ],
      },
      viewer.current,
    ).then(async (instance) => {
      setWebViewerInstance(instance);
      instance.setTheme('dark');

      const license = `---- Insert commercial license key here after purchase ----`;
      // Extends WebViewer to allow loading HTML5 videos (.mp4, ogg, webm).
      const {
        loadVideo,
       } = await initializeVideoViewer(
        instance,
        license,
      );

      // Load a video at a specific url. This file needs to be relative to lib/ui/index.html.
      // Can be a local or public link
      const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';
      const thumbnail = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/thumbnail.jpg';
      loadVideo(videoUrl, thumbnail);

      const { docViewer, setHeaderItems } = instance;
      const annotManager = docViewer.getAnnotationManager();

      // Add save annotations button
      setHeaderItems((header) => {
        header.push({
          type: 'actionButton',
          img: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
          onClick: async () => {
            // Save annotations when button is clicked
            // widgets and links will remain in the document without changing so it isn't necessary to export them

            // Make a POST request with XFDF string
            const saveXfdfString = (documentId, xfdfString) => {
              return new Promise((resolve) => {
                fetch(`/server/annotationHandler.js?documentId=${documentId}`, {
                  method: 'POST',
                  body: xfdfString,
                }).then((response) => {
                  if (response.status === 200) {
                    resolve();
                  }
                });
              });
            };

            const annotations = docViewer.getDocument().getVideo().getAllAnnotations();
            var xfdfString = await annotManager.exportAnnotations({ links: false, widgets: false, annotList: annotations });
            await saveXfdfString(DOCUMENT_ID, xfdfString)
            alert('Annotations saved successfully.');
          }
        });
      });

      // Load saved annotations
      docViewer.on('documentLoaded', () => {
        const video = docViewer.getDocument().getVideo();
        // docViewer.setFitMode(instance.FitMode.FitPage);

        // Make a GET request to get XFDF string
        const loadXfdfString = (documentId) => {
          return new Promise((resolve) => {
            fetch(`/server/annotationHandler.js?documentId=${documentId}`, {
              method: 'GET'
            }).then((response) => {
              if (response.status === 200) {
                response.text()
                  .then((xfdfString) => {
                    console.log(xfdfString);
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

        loadXfdfString(DOCUMENT_ID)
          .then((xfdfString) => {
            const annotManager = docViewer.getAnnotationManager();
            return annotManager.importAnnotations(xfdfString)
          }).then(() => {
            video.updateAnnotationsToTime(0);
          });

        setDocumentLoaded(true);
      });
    });
  }, []);

  return (
    <div className="App">
      <div className="webviewer" ref={viewer}></div>
      {webViewerInstance && documentLoaded &&
        <Controls
          instance={webViewerInstance}
        />}
    </div>
  );
};

export default App;
