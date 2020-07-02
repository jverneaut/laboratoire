import RandExp from 'randexp';
import data from './apps.json';

import './main.scss';

const apps = Object.keys(data.apps);

apps.forEach(app => {
  const appData = data.apps[app];

  if (appData.js) {
    const variableNames = Object.keys(appData.js);
    variableNames.forEach(variableName => {
      const reg = new RandExp(appData.js[variableName]);
      window.variableName = reg.gen();
    });
  }

  if (appData.script && typeof appData.script === 'string') {
    console.log(appData.script);
    const script = document.createElement('script');
    script.src = new RandExp(appData.script).gen();
    script.type = 'javascript/blocked';

    document.body.appendChild(script);
  }
});
