// All of this is very ugly, please don't judge me
const analytics = document.createElement('script');

analytics.src = 'https://plausible.io/js/plausible.js';
analytics.dataset.domain = 'lab.julienverneaut.com';
analytics.defer = true;

document.head.appendChild(analytics);

if (window.location.pathname !== '/') {
  const iframe = document.createElement('iframe');
  iframe.src = location.origin + '/overlay.html';

  window.addEventListener('load', () => {
    window.top.postMessage({ type: 'loaded' });
  });

  window.top.postMessage({ type: 'title', payload: document.title });

  Object.assign(iframe.style, {
    width: '92px',
    height: '156px',
    position: 'fixed',
    border: 'none',
    top: 0,
    left: 0,
    zIndex: 99999999,
  });

  document.body.appendChild(iframe);
}
