import { spotifyClientId, redirectUri } from './globals.js';

const urlParams = new URLSearchParams(window.location.search);
let code = urlParams.get('code');
let codeVerifier = localStorage.getItem('code-verifier');

let body = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
  client_id: spotifyClientId,
  code_verifier: codeVerifier,
});

console.log(body);

const response = fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: body,
})
  .then((response) => {
    if (!response.ok) {
      throw new Error('HTTP status ' + response.status);
    }
    return response.json();
  })
  .then((data) => {
    localStorage.setItem('access-token', data.access_token);
    window.location = 'app.html';
  })
  .catch((error) => {
    console.error('Error:', error);
  });
