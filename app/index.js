import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import myApp from './reducers';
import App from './components/App';

import './main.css';

const store = createStore(myApp);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);
