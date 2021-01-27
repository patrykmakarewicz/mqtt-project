import { useEffect, useState } from "react";
import mqtt from "mqtt";
import axios from "axios";

const EXPRESS_PORT = 8000;
const SOCKET_PORT = 8001;

const API = `http://localhost:${EXPRESS_PORT}`;
const BROKER = `ws://localhost:${SOCKET_PORT}`;

function App() {
  const [connected, setConnected] = useState(false);

  async function createRoom() {
    const response = await axios.get(`${API}/create-room`);
    console.log(response);
  }

  useEffect(() => {
    let client = null;
    try {
      client = mqtt.connect(BROKER);
    } catch (err) {
      console.log(`mqtt connecting error`, err);
    }

    client.on("connect", () => {
      setConnected(true);
    });
  }, []);
  return (
    <div>
      {(connected && "connected") || "not connected"}
      <div>
        <button className="button" onClick={createRoom}>
          create room
        </button>
      </div>
    </div>
  );
}

export default App;
