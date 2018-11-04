import React from 'react';
import ReactDom from 'react-dom';

class App extends React.Component {
  render() {
    return (
      <div>
        This is your fucking app
      </div>
    )
  }
}

chrome.runtime.onMessage.listener((request, sender, response) => {
  if(request.injectApp) {
    injectApp();
    response({
      startedExtension: true,
    });
  }
})

function injectApp() {
  const newDiv = document.createElement("div");
  newDiv.setAttributes("id", "chromeExtensionReactApp");
  document.body.appendChild(newDiv);
  ReactDom.render(<App />, newDiv);
}
