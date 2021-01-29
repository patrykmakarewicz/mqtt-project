import { useState, useEffect } from "react";
import Lobby from "./Lobby";
import Room from "./Room";
import mqtt from "mqtt";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const SOCKET_PORT = 8001;
const BROKER = `ws://localhost:${SOCKET_PORT}`;

function App() {
  const [client, setClient] = useState(null);

  useEffect(() => {
    async function connect() {
      try {
        const c = await mqtt.connect(BROKER);
        c.on("connect", () => {
          setClient(c);
        });
      } catch (err) {
        console.log(`mqtt connecting error`, err);
      }
    }
    connect();
  }, []);
  return (
    <Router>
      <Switch>
        <Route exact path="/">
          <Lobby client={client} />
        </Route>
        <Route path="/room/:id">
          <Room client={client} />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
