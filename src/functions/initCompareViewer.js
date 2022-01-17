/** 
 * File containing functions to set up the child webviewer instances.
*/

const initCompareViewer = instance => {
  instance.iframeWindow.frameElement.style.position = 'relative';

  instance.disableElements([
    'toggleNotesButton',
    'ribbons',
    'menuButton',
    'MergeAnnotationsTool',
    'toolsHeader',
    'notesPanel',
    'toolsOverlay',
  ]);
  
  instance.UI.disableToolDefaultStyleUpdateFromAnnotationPopup();
};

const switchActiveInstance = async ({
  state, overlayWrapper, activeInstance, setActiveInstance,
}) => {
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

export {
  initCompareViewer,
  switchActiveInstance,
};