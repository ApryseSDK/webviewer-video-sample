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

export {
  initCompareViewer,
};