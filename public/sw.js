console.log('In service worker');

const videoEndpoint = new URL(location).searchParams.get('videoEndpoint');
const authToken = new URL(location).searchParams.get('authToken');

self.addEventListener("fetch", event => {
  // Only inject custom headers into videos from my endpoint
  console.log(new URL(event.request.url).origin, videoEndpoint);
  if (new URL(event.request.url).origin === videoEndpoint) {
    console.log('adding custom headers');
    event.respondWith(customHeaderRequestFetch(event));
  }
});

function customHeaderRequestFetch(event) {
  let headers = new Headers();
  headers.append('Authorization', authToken);

  const newRequest = new Request(event.request, {
    withCredentials: true,
    mode: 'cors',
    headers,
  });
  return fetch(newRequest);
}