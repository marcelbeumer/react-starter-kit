/* eslint no-console:0 */
import 'babel-polyfill';
import './style/index.css';
import createDebug from 'debug';
import { expose } from './global';
import createRenderer from './renderer/browser';
import DataTree from './data/tree';
import createReduxStore from './redux';
import createRxJsStore from './rxjs';
import createRoutes from './route';
import Router from './router';
import { skip } from 'rxjs/operator/skip';

let router; // eslint-disable-line prefer-const
const debug = createDebug('browser');
debug('starting bootstrap');

global.onunhandledrejection = ({ reason }) =>
  console.error(reason.stack || reason);

function getData(id) {
  const json = (document.getElementById(id) || {}).textContent;
  return json ? JSON.parse(json) : {};
}

function bootstrapRedux() {
  const initialState = DataTree.fromServerData(getData('data')); // eslint-disable-line new-cap
  const element = document.getElementById('root');
  const renderer = createRenderer(element);
  const actionServices = {};
  const renderServices = {};

  const { store, actions } = createReduxStore(initialState, actionServices, state =>
    renderer(state, actions, renderServices));

  router = new Router(createRoutes(actions), location.pathname, // eslint-disable-line prefer-const, max-len
    url => location.pathname !== url && history.pushState('', document.title, url));

  expose('renderer', renderer);
  expose('store', store);
  expose('actions', actions);
  expose('router', router);
  debug('bootstrap done');

  global.addEventListener('popstate', () => router.setUrl(location.pathname));
  actionServices.setUrl = router.setUrl.bind(router);
  renderServices.getUrl = router.getUrl.bind(router);

  if (element.querySelector('[data-react-checksum]')) {
    renderer(initialState, actions, renderServices);
  } else {
    router.runUrl(location.pathname);
  }
}

function bootstrapRxJS() {
  const initialState = DataTree.fromServerData(getData('data')); // eslint-disable-line new-cap
  const element = document.getElementById('root');
  const renderer = createRenderer(element);
  const actionServices = {};
  const renderServices = {};

  const { store, actions } = createRxJsStore(initialState, actionServices);
  store::skip(1).subscribe(state => renderer(state, actions, renderServices));

  router = new Router(createRoutes(actions), location.pathname, // eslint-disable-line prefer-const, max-len
    url => location.pathname !== url && history.pushState('', document.title, url));

  expose('renderer', renderer);
  expose('store', store);
  expose('actions', actions);
  expose('router', router);
  debug('bootstrap done');

  global.addEventListener('popstate', () => router.setUrl(location.pathname));
  actionServices.setUrl = router.setUrl.bind(router);
  renderServices.getUrl = router.getUrl.bind(router);

  if (element.querySelector('[data-react-checksum]')) {
    renderer(store.value, actions, renderServices);
  } else {
    router.runUrl(location.pathname);
  }
}

bootstrapRxJS();
// bootstrapRedux();
