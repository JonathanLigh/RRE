import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';

import configureStore from './store';

const wrapper = document.getElementById('app');
ReactDOM.render(
  <Provider store={configureStore()}>
  </Provider>, wrapper,
);
