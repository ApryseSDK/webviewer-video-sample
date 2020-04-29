import React, { useRef, useEffect } from 'react';
import WebViewer from '@pdftron/webviewer';
import { initializeVideoViewer, loadVideo, loadVideoUI } from 'video';
import './App.css';

const DOCUMENT_ID = 'video';

const App = () => {
  const viewer = useRef(null);

  // if using a class, equivalent of componentDidMount
  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        disabledElements: [
          'searchButton',
          'pageNavOverlay',
          'viewControlsButton',
          'panToolButton',
        ],
      },
      viewer.current,
    ).then(async (instance) => {
      instance.setTheme('dark');

      const license = `---- Insert commercial license key here after purchase ----`;
      // Extends document class to support documents of type 'video'
      await initializeVideoViewer(
        instance,
        license,
      );

      // Attaches the video player UI
      loadVideoUI(instance);


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
      });
    });
  }, []);

  return (
    <div className="App">
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default App;
