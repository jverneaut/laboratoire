// All of this is very ugly, please don't judge me
const isHomePage = window.location.pathname === '/';
const isEmbedded =
  !document.referrer.includes('lab.julienverneaut.com') ||
  !document.referrer.length;

if (!isHomePage && !isEmbedded) {
  const iframe = document.createElement('iframe');
  iframe.src = location.origin + '/overlay.html';

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

if (!isHomePage) {
  window.addEventListener('load', () => {
    window.top.postMessage({ type: 'loaded' });
  });

  window.top.postMessage({ type: 'title', payload: document.title });
}
