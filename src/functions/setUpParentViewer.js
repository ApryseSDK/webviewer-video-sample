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
    instance1.UI.setFramesVisibility(e.detail.videoSettings.showFrames);
    instance2.UI.setFramesVisibility(e.detail.videoSettings.showFrames);
  };
};

const setUpParentViewer = ({ parentInstance, instance1, instance2, videoInstance1, videoInstance2 }, parentWrapper, activeInstance) => {
  parentInstance.disableElements([
    'downloadButton',
    'selectToolButton',
    'zoomOverlayButton',
    'toolbarGroup-View',
  ]);

  setDisplayTheme({ detail: parentInstance.UI.selectors.getActiveTheme() });

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

  instance1AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance1);
  instance2AnnotManager.addEventListener('annotationChanged', onAnnotationChangedInstance2);

  return () => {
    parentInstance.iframeWindow.removeEventListener('themeChanged', parentSetDisplayTheme);
    parentInstance.iframeWindow.removeEventListener('customMenuOpened', parentOnCustomMenuOpened);
    parentInstance.iframeWindow.removeEventListener('videoSettingsUpdated', parentOnVideoSettingsUpdated);
    parentInstance.docViewer.removeEventListener('toolUpdated', parentOnToolUpdate);
    parentInstance.docViewer.removeEventListener('toolModeUpdated', parentOnToolModeUpdate);

    instance1AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance1);
    instance2AnnotManager.removeEventListener('annotationChanged', onAnnotationChangedInstance2);
  };
};

const onParentDocumentLoaded = (instance, parentWrapper, compareContainer) => {
  let isStylingOpen = false;

  return () => {
    instance.UI.setZoomLevel(1.5);
    instance.UI.disableElements([
      'MergeAnnotationsTool',
      // We disable this tool as there is a bug in webviewer where an event isn't fired when the stamp is updated
      'rubberStampToolGroupButton',
    ]);

    instance.UI.setHeaderItems(function(header) {
      header.getHeader('default').delete(1);
    });

    const setUpToolsOverlayObserver = () => {
      const observer = new MutationObserver(toolsContainerCallback);
      observer.observe(toolsContainer, { attributes: true });
      return observer;
    };

    let toolsContainer = instance.iframeWindow.document.querySelector('.tools-container');        
    const toolsContainerCallback = mutationList => {
      mutationList.forEach(function(mutation                                                                                                                                                                                                                                   ) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          isStylingOpen = false;

          if (mutation.target.classList.contains('is-styling-open')) {
            parentWrapper.current.style.zIndex = 2;
            isStylingOpen = true;
          } else if (window.innerWidth > 640) {
            parentWrapper.current.style.zIndex = 0;
          }
        }
      });
    };

    window.onresize = () => {
      if (window.innerWidth <= 640 && !isStylingOpen) {
        parentWrapper.current.style.zIndex = 2;
      } else {
        parentWrapper.current.style.zIndex = 0;
      }
    };

    const onToolsContainerDisplay = (_, observer) => {
      toolsContainer = instance.iframeWindow.document.querySelector('.tools-container');

      if (toolsContainer) {
        setUpToolsOverlayObserver();
        observer.disconnect();
      }
      toolsContainer && setUpToolsOverlayObserver();
    };

    if (!toolsContainer) {
      const documentObserver = new MutationObserver(onToolsContainerDisplay);
      documentObserver.observe(instance.iframeWindow.document, { childList: true, subtree: true });
    } else {
      setUpToolsOverlayObserver();
    }
  
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
  onParentDocumentLoaded,
};
