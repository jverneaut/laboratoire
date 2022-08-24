import React, { useState } from 'react';
import Card from './Card';

export const THRESHOLD = 120;
export const RENDERED = 5;

const cards = [
  {
    name: 'Andy Bernard',
    img: require('../img/Andy_Bernard_photoshot.jpg').default,
  },
  {
    name: 'Ryan Howard',
    img: require('../img/Ryan_Howard_(The_Office).jpg').default,
  },
  {
    name: 'Pam Beesly',
    img: require('../img/Pam_Beesley.jpg').default,
  },
  {
    name: 'Jim Halpert',
    img: require('../img/Jim-halpert.jpg').default,
  },
  {
    name: 'Dwight Schrute',
    img: require('../img/Dwight_Schrute.jpg').default,
  },
  {
    name: 'Michael Scott',
    img: require('../img/MichaelScott.png').default,
  },
  {
    name: 'Holly Flax',
    img: require('../img/Hollytheoffice.jpg').default,
  },
  {
    name: 'Gabe Lewis',
    img: require('../img/Gabe_profile_picture.jpg').default,
  },
  {
    name: 'Erin Hannon',
    img: require('../img/Erin_Hannon.jpg').default,
  },
  {
    name: 'Jan Levinson',
    img: require('../img/Melora_Hardin_as_Jan_Levinson.png').default,
  },
  {
    name: 'Kelly Kapoor',
    img: require('../img/Kelly_Kapoor.jpg').default,
  },
  {
    name: 'Toby Flenderson',
    img: require('../img/Toby_Flenderson_promo_picture.jpg').default,
  },
  { name: 'Darryl Philbin', img: require('../img/DarrylPhilbin.jpg').default },
  {
    name: 'Creed Bratton',
    img: require('../img/CreedBratton(TheOffice).jpg').default,
  },
  {
    name: 'Phyllis Vance',
    img: require('../img/Phyllis_Lapin-Vance.jpg').default,
  },
  {
    name: 'Oscar Martinez',
    img: require('../img/Oscar_Martinez_of_The_Office.jpg').default,
  },
  { name: 'Angela Martin', img: require('../img/Angela_Martin.jpg').default },
  {
    name: 'Meredith Palmer',
    img: require('../img/Meredith_Palmer.jpg').default,
  },
  { name: 'Stanley Hudson', img: require('../img/Stanley_Hudson.jpg').default },
  {
    name: 'Kevin Malone',
    img: require('../img/Office-1200-baumgartner1.jpg').default,
  },
].sort(() => 0.5 - Math.random());

const App = () => {
  const [current, setCurrent] = useState(0);

  return (
    <main>
      <img
        src={require('../img/The_Office_US_logo.svg').default}
        className="logo"
        alt=""
      />
      {cards
        .map((card, index) => (
          <Card
            key={card.name}
            index={index}
            current={current}
            setCurrent={setCurrent}
          >
            <h2>{card.name}</h2>
            <img src={card.img} alt="" />
          </Card>
        ))
        .reverse()}
    </main>
  );
};

export default App;
