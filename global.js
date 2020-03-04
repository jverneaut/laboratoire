// All of this is very ugly, please don't judge me
const analytics = document.createElement('script');
analytics.src = 'https://www.googletagmanager.com/gtag/js?id=UA-120978536-6';

const analyticsScript = document.createElement('script');
analyticsScript.innerHTML = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-120978536-6');
`;

document.head.appendChild(analytics);
document.head.appendChild(analyticsScript);

if (window.location.pathname !== '/') {
  const html = `
    <style>
      * {
        margin: 0;
      }

      body {
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      a {
        background: white;
        height: 56px;
        width: 56px;
        border-radius: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.16);
      }
    </style>

    <a href="${window.location.origin}" target="_parent">
      <svg fill="#9e166e" width="24" height="16" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="2"></rect>
        <rect width="24" height="2" y="7"></rect>
        <rect width="24" height="2" y="14"></rect>
      </svg>
    </a>
  `;

  const iframe = document.createElement('iframe');
  iframe.src = 'data:text/html;charset=utf-8,' + escape(html);

  Object.assign(iframe.style, {
    width: '92px',
    height: '92px',
    position: 'fixed',
    border: 'none',
    top: 0,
    left: 0,
    zIndex: 99999999,
  });

  document.body.appendChild(iframe);
}