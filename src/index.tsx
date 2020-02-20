import React from "react";
import ReactDOM from "react-dom";
import Helmet from "react-helmet";
import { Provider } from "react-redux";
import { createStore } from "redux";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import { rootReducer } from "./store";

let store = createStore(rootReducer);

const title = "Frogger";
const description = "Play your Frogger classic arcade game, with a twist.";
const image = require("./assets/frog.png");

ReactDOM.render(
  <Provider store={store}>
    
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta itemProp="name" content={title}/>
      <meta itemProp="description" content={description}/>
      <meta itemProp="image" content={image}/>

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
    <App />
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
