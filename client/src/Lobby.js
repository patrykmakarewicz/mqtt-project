import { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";

const EXPRESS_PORT = 8000;
const API = `http://localhost:${EXPRESS_PORT}`;

function Lobby({ client }) {
  const history = useHistory();
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState([]);

  async function createRoom() {
    const { data } = await axios.get(`${API}/create-room`);
    const { id } = data.room;
    history.push(`/room/${id}`);
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
          setRooms((x) => [...x, message]);
        }
      });
    }
  }, [client]);
  return (
    <div>
      {connected ? (
        <div>
          <div className="has-text-info">connected to the server</div>
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
      ) : (
        <div className="has-text-danger">not connected to the server</div>
      )}
    </div>
  );
}

export default Lobby;
