// All of this is very ugly, please don't judge me
const isHomePage = window.location.pathname === '/';

if (!isHomePage) {
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
