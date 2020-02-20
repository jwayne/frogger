import React from "react";
import ReactDOM from "react-dom";
import Favicon from "react-favicon";
import Helmet from "react-helmet";
import { Provider } from "react-redux";
import { createStore } from "redux";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { rootReducer } from "./store";

let store = createStore(rootReducer);

ReactDOM.render(
  <Provider store={store}>
    <Favicon url={require("./assets/frog.png")} />
    <Helmet>
      <title>Frogger</title>
      <meta name="description" content="Play your Frogger classic arcade game, with a twist." />
      <meta property="og:title" content="Frogger" />
      <meta property="og:image" content={require("./assets/frog.png")} />
    </Helmet>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
