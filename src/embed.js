window.addEventListener('load', () => {
  window.top.postMessage({ type: 'loaded' });
});

window.top.postMessage({ type: 'title', payload: document.title });
