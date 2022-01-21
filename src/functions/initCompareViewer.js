/** 
 * File containing functions to set up the child webviewer instances.
*/

/**
 * 
 * @param {WebviewerInstance} mainInstance - The instance to add the sync button
 * @param {import("@pdftron/webviewer-video").WebViewerVideoInstance} mainVideoInstance - the main video instance in sync procedure
 * @param {WebviewerInstance} secondaryInstance - The secondary compare instance to update sync status
 * @param {import("@pdftron/webviewer-video").WebViewerVideoInstance} secondaryVideoInstance - the secondary video instance in sync procedure
 */
const createSyncButton = ({
  mainInstance,
  mainVideoInstance,
  secondaryInstance,
  secondaryVideoInstance,
}) => {
  const { setHeaderItems, updateElement: updateMainElement } = mainInstance;
  const { updateElement: updateSecondaryElement } = secondaryInstance;
  let isSynced = false;
  let syncingVideo;

  setHeaderItems(header => {
    let index = header.getHeader('default').getItems().findIndex(item => item.dataElement === 'syncPlaybackButton');

    if (index === -1) {
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
          updateMainElement('syncPlaybackButton', {
            className: `${ isSynced ? 'active' : ''}`
          });
  
          updateSecondaryElement('syncPlaybackButton', {
            className: `${ isSynced ? 'active' : ''}`
          });
  
          const video1 = mainVideoInstance.getVideo();
          const video2 = secondaryVideoInstance.getVideo(); 
  
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
    }
  });
};

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
  createSyncButton,
  initCompareViewer,
  switchActiveInstance,
};