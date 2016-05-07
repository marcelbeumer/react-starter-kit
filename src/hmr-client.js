/* global __resourceQuery */
/* eslint no-console:0 */
const client = require('webpack-hot-middleware/client' + __resourceQuery); // eslint-disable-line max-len, prefer-template

const styles = [];

function cleanupStilr() {
  console.log('[HMR] cleaning up stilr');
  styles.splice(2).forEach(style => document.head.removeChild(style));
}

function updateStilr(css) {
  console.log('[HMR] updating stilr');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  styles.unshift(style);

  if (styles.length > 2) {
    cleanupStilr();
  }
}

client.subscribe(obj => {
  const { action, payload } = obj;
  if (action === 'update-stilr') {
    updateStilr(payload);
  }
});
