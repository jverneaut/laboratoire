import React from 'react';
import profileSrc from '../profile.jpg?size=100';

const Infos = () => (
  <div className="infos">
    <div className="infos__profile">
      <img src={profileSrc} alt="" />
    </div>
    <div className="infos__content">
      <div className="infos__name">
        Julien Verneaut -{' '}
        <a href="mailto:jverneaut@gmail.com">jverneaut@gmail.com</a>
      </div>
      <a href="https://www.julienverneaut.com" className="infos__contact">
        https://www.julienverneaut.com
      </a>
    </div>
  </div>
);

export default Infos;
