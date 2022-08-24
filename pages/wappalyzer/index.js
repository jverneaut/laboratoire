import './index.scss';

import RandExp from 'randexp';

const importAll = r => {
  return r.keys().map(r);
};

const technologiesGroups = importAll(
  require.context('./technologies', false, /\.json$/)
);

const generateValue = regStr => {
  const reg = new RandExp(regStr);
  return reg.gen();
};

technologiesGroups.forEach(technologiesGroup => {
  Object.values(technologiesGroup).forEach(technology => {
    // Create cookie with key and generated value
    if (technology.cookies) {
      Object.keys(technology.cookies).forEach(cookieKey => {
        const cookieValue = generateValue(technology.cookies[cookieKey]);
        const cookiePath = window.location.pathname;

        document.cookie = `${cookieKey}=${cookieValue};path=${cookiePath}`;
      });
    }

    // Not implemented
    if (technology.dom) {
    }

    // Not implemented
    if (technology.dns) {
    }

    // Pollute global scope
    if (technology.js) {
      Object.keys(technology.js).forEach(propertyName => {
        window[propertyName] = generateValue(technology.js[propertyName]);
      });
    }

    // Not implemented
    if (technology.headers) {
    }

    // Not implemented
    if (technology.html) {
    }

    // Not implemented
    if (technology.text) {
    }

    // Not implemented
    if (technology.css) {
    }

    // Not implemented
    if (technology.robots) {
    }

    // Not implemented
    if (technology.url) {
    }

    // Not implemented
    if (technology.xhr) {
    }

    // Generate meta tags
    if (technology.meta) {
      Object.keys(technology.meta).forEach(metaName => {
        const meta = document.createElement('meta');
        meta.name = metaName;
        meta.content = generateValue(
          [technology.meta[metaName]].flat().join(' ')
        );

        document.head.appendChild(meta);
      });
    }

    // Add scripts with generated src
    if (technology.scriptSrc) {
      [technology.scriptSrc].flat().forEach(scriptSrc => {
        const script = document.createElement('script');
        script.src = generateValue(scriptSrc);
        script.type = 'javascript/blocked';

        document.head.appendChild(script);
      });
    }
  });
});
