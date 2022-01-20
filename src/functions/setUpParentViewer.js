/** 
 * File containing functions to set up the parent viewer.
 * 
 * Adds event listeners to the appropriate webviewer instances to allow parent instance to control child instances
*/

const setDisplayTheme = (instance1, instance2) => {
  return e => {
    instance1.UI.setTheme(e.detail);
    instance2.UI.setTheme(e.detail);
  };
};

const onToolUpdate = (instance1, instance2) => {
  return e => {
    const instance1ToolModeMap = instance1.docViewer.getToolModeMap();
    const instance2ToolModeMap = instance2.docViewer.getToolModeMap();

    instance1ToolModeMap[e.name] && instance1ToolModeMap[e.name].setStyles(e.defaults);
    instance2ToolModeMap[e.name] && instance2ToolModeMap[e.name].setStyles(e.defaults);
  };
};

const onToolModeUpdate = (instance1, instance2) => {
  return e => {
    instance1.UI.setToolMode(e.name);
    instance2.UI.setToolMode(e.name);
  };
};

const onAnnotationChanged = ({
  instance, parentInstance, instance1, instance2, activeInstance
}) => {
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

const onZoomUpdated = (instance1, instance2) => {
  return newZoomLevel => {
    instance1.UI.setZoomLevel(newZoomLevel);
    instance2.UI.setZoomLevel(newZoomLevel);
  };
};

const onCustomMenuOpened = parentWrapper => {
  return e => {
    if (e.detail.isMenuOpen) {
      parentWrapper.current.style.zIndex = 2;
    } else {
      parentWrapper.current.style.zIndex = 0;
    }
  };
};

const onVideoSettingsUpdated = (instance1, instance2) => {
  return e => {
    instance1.UI.setAudioElementVisibility(e.detail.videoSettings.showAudioViewer);
    instance2.UI.setAudioElementVisibility(e.detail.videoSettings.showAudioViewer);
  };
};

const setUpParentViewer = ({ parentInstance, instance1, instance2, videoInstance1, videoInstance2 }, parentWrapper, activeInstance) => {
  parentInstance.disableElements([
    'downloadButton',
    'selectToolButton',
    'zoomOverlay',
  ]);
  setDisplayTheme({ detail: parentInstance.UI.selectors.getActiveTheme() });

  const parentOnZoomUpdated = onZoomUpdated(instance1, instance2);
  const parentSetDisplayTheme = setDisplayTheme(instance1, instance2);
  const parentOnToolUpdate = onToolUpdate(instance1, instance2);
  const parentOnCustomMenuOpened = onCustomMenuOpened(parentWrapper);
  const parentOnToolModeUpdate = onToolModeUpdate(instance1, instance2);
  const parentOnVideoSettingsUpdated = onVideoSettingsUpdated(videoInstance1, videoInstance2);

  const instance1AnnotManager = instance1.docViewer.getAnnotationManager();
  const instance2AnnotManager = instance2.docViewer.getAnnotationManager();
  const onAnnotationChangedInstance1 = onAnnotationChanged({
    instance: 1,
    parentInstance,
    instance1,
    instance2,
    activeInstance,
  });
  const onAnnotationChangedInstance2 = onAnnotationChanged({
    instance: 2,
    parentInstance,
    instance1,
    instance2,
    activeInstance,
  });

  parentInstance.iframeWindow.addEventListener('themeChanged', parentSetDisplayTheme);
  parentInstance.iframeWindow.addEventListener('customMenuOpened', parentOnCustomMenuOpened);
  parentInstance.iframeWindow.addEventListener('videoSettingsUpdated', parentOnVideoSettingsUpdated);
  parentInstance.docViewer.addEventListener('toolUpdated', parentOnToolUpdate);
  parentInstance.docViewer.addEventListener('toolModeUpdated', parentOnToolModeUpdate);
  parentInstance.docViewer.addEventListener('zoomUpdated', parentOnZoomUpdated);


  instance1AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance1);
  instance2AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance2);

  return () => {
    parentInstance.iframeWindow.removeEventListener('themeChanged', parentSetDisplayTheme);
    parentInstance.iframeWindow.removeEventListener('customMenuOpened', parentOnCustomMenuOpened);
    parentInstance.iframeWindow.removeEventListener('videoSettingsUpdated', parentOnVideoSettingsUpdated);
    parentInstance.docViewer.removeEventListener('toolUpdated', parentOnToolUpdate);
    parentInstance.docViewer.removeEventListener('toolModeUpdated', parentOnToolModeUpdate);
    parentInstance.docViewer.removeEventListener('zoomUpdated', parentOnZoomUpdated);


    instance1AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance1);
    instance2AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance2);
  };
};

const createSyncButton = (instance, globalInstance1, globalInstance2) => {
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

const onParentDocumentLoaded = (instance, parentWrapper, compareContainer) => {
  return () => {
    instance.UI.setZoomLevel(1.5);
    const toolsContainer = instance.iframeWindow.document.querySelector('.tools-container');        
    const toolsContainerCallback = mutationList => {
      mutationList.forEach(function(mutation                                                                                                                                                                                                                                   ) {
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
};

export {
  setUpParentViewer,
  createSyncButton,
  onParentDocumentLoaded,
};