import React from 'react';
import ReactDom from 'react-dom';
// import { Provider } from 'react-redux';

// import configureStore from './store';

// const wrapper = document.getElementById('app');
// ReactDOM.render(
//   <Provider store={configureStore()}>
//   </Provider>, wrapper,
// );

class Main extends React.Component {
  render() {
    return (
        <div className={'my-extension'}>
            <h1>Hello world - My first Extension</h1>
        </div>
    )
  }
}
