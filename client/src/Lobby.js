import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const EXPRESS_PORT = 8000;

const API = `http://localhost:${EXPRESS_PORT}`;

function Lobby({ client }) {
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);

  async function createRoom() {
    const { data } = await axios.get(`${API}/create-room`);
    const { id } = data.room;
  }

  useEffect(() => {
    async function fetchRooms() {
      const {
        data: { rooms },
      } = await axios.get(`${API}/rooms`);
      setRooms(rooms);
    }
    fetchRooms();
  }, []);

  useEffect(() => {
    if (client) {
      setConnected(true);

      client.subscribe("rooms");

      client.on("message", (topic, message) => {
        message = message.toString();
        topic = topic.toString();
        if (topic === "rooms") {
          setRooms([...rooms, message]);
        }
      });
    }
  }, [client, rooms]);
  return (
    <div>
      {(connected && "connected") || "not connected"}
      <div>
        <button className="button" onClick={createRoom}>
          create room
        </button>
        {rooms &&
          rooms.map((room, id) => (
            <div key={id}>
              <Link to={`/room/${room}`}> {room} </Link>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Lobby;
