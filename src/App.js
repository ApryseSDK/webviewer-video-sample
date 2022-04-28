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

const App = () => {
  const viewer = useRef(null);
  const inputFile = useRef(null);
  const [state, setState] = useState({ instance: null, videoInstance: null, audioInstance: null });

  useEffect(() => {
    WebViewer(
      {
        path: '/webviewer/lib',
        fullAPI: true,
        enableRedaction: true,        
      },
      viewer.current,
    ).then(async instance => {
      const { Annotations, annotationManager, Tools, documentViewer } = instance.Core;

      // window.foo = instance.UI.createPageRedactions;
      window.foo = pageNumbers => {
        const annots = [];
        for (const page of pageNumbers) {
          const pageInfo = documentViewer.getDocument().getPageInfo(page);
          if (pageInfo) {
            const redaction = new Annotations.RedactionAnnotation({
              PageNumber: page,
              Rect: new Annotations.Rect(0, 0, pageInfo.width, pageInfo.height),
            });
            redaction.type = 'fullPage';
            redaction.setCustomData('trn-redaction-type', 'fullPage');
            redaction.Author = annotationManager.getCurrentUser();
            redaction.startTime = 0;
            redaction.endTime = 300;
            annots.push(redaction);
          }
        }
        annotationManager.addAnnotations(annots);
        annotationManager.drawAnnotationsFromList(annots);
        return annots;
      };

      class TriangleAnnotation extends Annotations.CustomAnnotation {
        constructor() {
          super('triangle'); // provide the custom XFDF element name
          this.Subject = 'Redact';
          this.type = 'fullVideoFrame';
        }

        draw(ctx, pageMatrix) {
          // the setStyles function is a function on markup annotations that sets up
          // certain properties for us on the canvas for the annotation's stroke thickness.
          this.setStyles(ctx, pageMatrix);
      
          // first we need to translate to the annotation's x/y coordinates so that it's
          // drawn in the correct location
          ctx.translate(this.X, this.Y);
          ctx.beginPath();
          ctx.moveTo(this.Width / 2, 0);
          ctx.lineTo(this.Width, this.Height);
          ctx.lineTo(0, this.Height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }
    
      // this is necessary to set the elementName before instantiation
      TriangleAnnotation.prototype.elementName = 'triangle';
      annotationManager.registerAnnotationType(TriangleAnnotation.prototype.elementName, TriangleAnnotation);

      class TriangleCreateTool extends Tools.GenericAnnotationCreateTool {
        constructor(documentViewer) {
          // TriangleAnnotation is the class (function) for our annotation we defined previously
          super(documentViewer, TriangleAnnotation);
        }
      }

      const license = `---- Insert commercial license key here after purchase ----`;
      // const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';
      // const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4';
      const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/dog.mp4';
      // const videoUrl = '/dog-tall-video.mp4';
      // const videoUrl = 'https://pdftron.s3.amazonaws.com/downloads/pl/video/world-test.mp4';
      // const videoUrl = '/world-test.mp4';

      const triangleToolName = 'AnnotationCreateTriangle';
      const triangleTool = new TriangleCreateTool(documentViewer);
      instance.UI.registerTool({
        toolName: triangleToolName,
        toolObject: triangleTool,
        buttonImage: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">' +
          '<path d="M12 7.77L18.39 18H5.61L12 7.77M12 4L2 20h20L12 4z"/>' +
          '<path fill="none" d="M0 0h24v24H0V0z"/>' +
        '</svg>',
        buttonName: 'triangleToolButton',
        tooltip: 'Triangle'
      }, TriangleAnnotation);
      
      instance.UI.setHeaderItems(header => {
        header.getHeader('toolbarGroup-Shapes').get('freeHandToolGroupButton').insertBefore({
          type: 'toolButton',
          toolName: triangleToolName,
        });
      });
      
      documentViewer.addEventListener('documentLoaded', () => {
        // set the tool mode to our tool so that we can start using it right away
        instance.UI.setToolMode(triangleToolName);
      });

      const audioInstance = await initializeAudioViewer(
        instance,
        { license },
      );

      const videoInstance = await initializeVideoViewer(
        instance,
        {
          license,
          AudioComponent: Waveform,
          generatedPeaks: !process.env.DEMO ? null : demoPeaks // waves can be pre-generated as seen here for fast loading: https://github.com/bbc/audiowaveform
        }
      );

      // const socket = new WebSocket('wss://dya2mxwl63.execute-api.us-west-2.amazonaws.com/production');
      // socket.onopen = () => console.log('connected');
      // socket.onmessage = event => {
      //   const data = JSON.parse(event.data);
      //   console.log(data);
      //   if (data.statusCode === 200) {
      //     videoInstance.loadVideo(data.body);
      //   } else {
      //     // either endpoint timeout issue or a different error occurred
      //   }
      // };
      // socket.onerror = error => console.log('error', error);
      // socket.onclose = () => {
      //   console.log('disconnected');
      // };

      // instance.UI.setCustomApplyRedactionsFunction(redactionAnnots => {
      //   const message = {
      //     "action": "video-redact",
      //     "intervals": [],
      //     "url": "https://pdftron.s3.amazonaws.com/downloads/pl/video/video.mp4"
      //   };
      //   redactionAnnots.forEach(redactionAnnot => {
      //     const { startTime, endTime } = redactionAnnot;
      //     message.intervals.push({ startTime, endTime });
      //   });
      //   socket.send(JSON.stringify(message), err => {
      //     console.log(err);
      //   });
      // });      

      instance.setTheme('dark');

      setState({ instance, videoInstance, audioInstance });

      // Load a video at a specific url. Can be a local or public link
      // If local it needs to be relative to lib/ui/index.html.
      // Or at the root. (eg '/video.mp4')
      videoInstance.loadVideo(videoUrl, {
        headers: {
          'x-api-key': 'skdfjsdkf',
        },
      });
      initializeHeader(instance);

      const { docViewer } = instance;
      const annotManager = docViewer.getAnnotationManager();

      if (process.env.DEMO) {
        // Load saved annotations
        docViewer.addEventListener(
          'videoElementLoaded', 
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
