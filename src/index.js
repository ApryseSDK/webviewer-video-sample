import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Add findDOMNode polyfill for React 19 compatibility
if (!ReactDOM.findDOMNode) {
  ReactDOM.findDOMNode = function(component) {
    if (component && component.current) {
      return component.current;
    }
    if (component && component.nodeType) {
      return component;
    }
    console.warn('findDOMNode is deprecated and has been removed in React 19. Please update your dependencies.');
    return null;
  };
}

// Add findDOMNode polyfill for React 19 compatibility
if (!ReactDOM.findDOMNode) {
  ReactDOM.findDOMNode = function(component) {
    if (component && component.current) {
      return component.current;
    }
    if (component && component.nodeType) {
      return component;
    }
    console.warn('findDOMNode is deprecated and has been removed in React 19. Please update your dependencies.');
    return null;
  };
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
