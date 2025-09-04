// React 19 polyfill for deprecated ReactDOM.findDOMNode
// This polyfill helps with libraries that still use the deprecated findDOMNode API

// Add polyfill to the global ReactDOM if it exists
if (typeof window !== 'undefined') {
  // Wait for ReactDOM to be available, then add the polyfill
  const addPolyfill = () => {
    const ReactDOM = window.ReactDOM || (window.React && window.React.DOM);
    if (ReactDOM && !ReactDOM.findDOMNode) {
      ReactDOM.findDOMNode = function(component) {
        // Basic polyfill for React 19 compatibility
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
  };
  
  // Try to add the polyfill immediately
  addPolyfill();
  
  // Also try after DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPolyfill);
  }
}
