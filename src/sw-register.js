export default function serviceWorkerRegister(videoEndpoint, authToken) {
  const swUrl = `${process.env.PUBLIC_URL}/sw.js?videoEndpoint=`
    + encodeURIComponent(videoEndpoint)
    + '&authToken='
    + encodeURIComponent(authToken);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(swUrl).then(() => {
      console.log('Service worker registered');
    });
  }
}