import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import registerFetchAuthInjection from './sw-register';

// Only inject custom headers into videos from my endpoint
const myVideoEndPoint = 'https://webviewer-video.s3.amazonaws.com';
const authenticationToken = 'Basic YWxhZGRpbjpvcGVuc2VzYW1l';
registerFetchAuthInjection(myVideoEndPoint, authenticationToken);

navigator.serviceWorker.ready.then(() => {
  ReactDOM.render(<App />, document.getElementById('root'));
});