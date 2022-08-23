import React, { useState } from 'react';
import Card from './Card';

export const THRESHOLD = 120;
export const RENDERED = 5;

const cards = [
  {
    name: 'Andy Bernard',
    img: require('../img/Andy_Bernard_photoshot.jpg'),
  },
  {
    name: 'Ryan Howard',
    img: require('../img/Ryan_Howard_(The_Office).jpg'),
  },
  {
    name: 'Pam Beesly',
    img: require('../img/Pam_Beesley.jpg'),
  },
  {
    name: 'Jim Halpert',
    img: require('../img/Jim-halpert.jpg'),
  },
  {
    name: 'Dwight Schrute',
    img: require('../img/Dwight_Schrute.jpg'),
  },
  {
    name: 'Michael Scott',
    img: require('../img/MichaelScott.png'),
  },
  {
    name: 'Holly Flax',
    img: require('../img/Hollytheoffice.jpg'),
  },
  {
    name: 'Gabe Lewis',
    img: require('../img/Gabe_profile_picture.jpg'),
  },
  {
    name: 'Erin Hannon',
    img: require('../img/Erin_Hannon.jpg'),
  },
  {
    name: 'Jan Levinson',
    img: require('../img/Melora_Hardin_as_Jan_Levinson.png'),
  },
  {
    name: 'Kelly Kapoor',
    img: require('../img/Kelly_Kapoor.jpg'),
  },
  {
    name: 'Toby Flenderson',
    img: require('../img/Toby_Flenderson_promo_picture.jpg'),
  },
  { name: 'Darryl Philbin', img: require('../img/DarrylPhilbin.jpg') },
  {
    name: 'Creed Bratton',
    img: require('../img/CreedBratton(TheOffice).jpg'),
  },
  { name: 'Phyllis Vance', img: require('../img/Phyllis_Lapin-Vance.jpg') },
  {
    name: 'Oscar Martinez',
    img: require('../img/Oscar_Martinez_of_The_Office.jpg'),
  },
  { name: 'Angela Martin', img: require('../img/Angela_Martin.jpg') },
  { name: 'Meredith Palmer', img: require('../img/Meredith_Palmer.jpg') },
  { name: 'Stanley Hudson', img: require('../img/Stanley_Hudson.jpg') },
  {
    name: 'Kevin Malone',
    img: require('../img/Office-1200-baumgartner1.jpg'),
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
