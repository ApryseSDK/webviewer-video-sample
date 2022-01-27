import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import CompareApp from './compare/Compare';

if (process.env.RUN_COMPARE) {
  ReactDOM.render(<CompareApp />, document.getElementById('root'));
} else {
  ReactDOM.render(<App />, document.getElementById('root'));
}