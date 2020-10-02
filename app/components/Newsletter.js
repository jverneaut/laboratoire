import React, { useState } from 'react';

const Newsletter = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    submitting: false,
    message: null,
  });

  const handleSubmit = async e => {
    e.preventDefault();

    setFormState(prevState => ({
      ...prevState,
      submitting: true,
      message: null,
    }));

    const url = window.location.origin + '/.netlify/functions/newsletter';

    const res = await fetch(url, {
      method: 'post',
      body: JSON.stringify({
        name: formState.name,
        email: formState.email,
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json();
    if (json.error) {
      setFormState(prevState => ({
        ...prevState,
        name: '',
        email: '',
        submitting: false,
        message: (
          <p>
            L'erreur suivante s'est produite, merci de réessayer :{' '}
            <strong>{json.message}</strong>.
          </p>
        ),
      }));
    } else {
      setFormState(prevState => ({
        ...prevState,
        name: '',
        email: '',
        submitting: false,
        message: (
          <p>
            <strong>Merci de votre inscription</strong> à la newsletter du
            laboratoire.
          </p>
        ),
      }));
    }
  };

  return (
    <div
      className={`newsletter${
        formState.submitting ? ' newsletter--submitting' : ''
      }`}
    >
      <div className="newsletter__container">
        <div className="newsletter__content">
          <h3>Du WebGL dans votre boîte mail</h3>
          <p>
            Abonnez-vous à la newsletter pour ne plus rater aucune expérience du
            laboratoire. 🔬🧪
          </p>
          <small>
            En soumettant ce formulaire vous acceptez que vos informations
            soient collectées et traitées par le service SendInBlue.
          </small>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="newsletter__fields">
            <div className="input-group">
              <label htmlFor="name">Nom</label>
              <input
                id="name"
                type="text"
                name="name"
                autoComplete="name"
                placeholder="Julien VERNEAUT"
                value={formState.name}
                onChange={e => {
                  e.persist();
                  setFormState(prevState => ({
                    ...prevState,
                    name: e.target.value,
                  }));
                }}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="name">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="jverneaut@gmail.com"
                value={formState.email}
                onChange={e => {
                  e.persist();
                  setFormState(prevState => ({
                    ...prevState,
                    email: e.target.value,
                  }));
                }}
                required
              />
            </div>
          </div>

          <div className="newsletter__controls">
            <input type="submit" className="btn" value="Je m'inscris" />
          </div>
          {formState.message ? (
            <div className="newsletter__message">{formState.message}</div>
          ) : null}
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
