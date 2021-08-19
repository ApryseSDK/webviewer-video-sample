const videoEndpoint = new URL(location).searchParams.get('videoEndpoint');
const passedHeaders = JSON.parse(new URL(location).searchParams.get('headers'));

self.addEventListener("fetch", event => {
  // Only inject custom headers if video matches video passed into webviewer
  if (event.request.url === videoEndpoint) {
    event.respondWith(customHeaderRequestFetch(event));
  }
});

function customHeaderRequestFetch(event) {
  let headers = new Headers();

  Object.keys(passedHeaders).forEach(key => {
    headers.append(key, passedHeaders[key]);
  });

  const newRequest = new Request(event.request, {
    withCredentials: true,
    mode: 'cors',
    headers,
  });
  return fetch(newRequest);
}