const initCompareViewer = instance => {
  instance.iframeWindow.frameElement.style.position = 'unset';

  instance.disableElements([
    'toggleNotesButton',
    'ribbons',
    'menuButton',
    'MergeAnnotationsTool',
    'toolsHeader',
    'notesPanel',
  ]);
  
  instance.UI.disableToolDefaultStyleUpdateFromAnnotationPopup();
};

export {
  initCompareViewer,
};