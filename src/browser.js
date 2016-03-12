import './style/index.css';
import createDebug from 'debug';
import { expose } from './global';
import createRenderer from './renderer/browser';
import DataTree from './data/tree';
import createActions from './action';
import createRedux from './redux';
import createRoutes from './route';
import { StatefulRouter } from './router';

let router;

const debug = createDebug('browser');
debug('starting bootstrap');

function getData(id) {
  const json = (document.getElementById(id) || {}).textContent;
  return json ? JSON.parse(json) : {};
}

const initialState = DataTree.fromServerData(getData('data')); // eslint-disable-line new-cap
const element = document.getElementById('root');
const renderer = createRenderer(element);
const renderServices = {};
const actions = createActions(() => router);
const { store, boundActions } = createRedux(initialState, actions, state =>
  renderer(state, boundActions, renderServices));

router = new StatefulRouter(createRoutes(store, actions), location.pathname,
  (url, title) => location.pathname !== url && history.pushState('', title, url));

expose('renderer', renderer);
expose('store', store);
expose('actions', actions);
expose('boundActions', boundActions);
expose('router', router);
debug('bootstrap done');

renderServices.getUrl = router.getUrl.bind(router);
renderer(initialState, boundActions, renderServices);

global.addEventListener('popstate', () => router.setUrl(location.pathname));
