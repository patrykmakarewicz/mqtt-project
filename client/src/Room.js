import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const EXPRESS_PORT = 8000;
const API = `http://localhost:${EXPRESS_PORT}`;

export default function Room({ client }) {
  const [room, setRoom] = useState({});

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const { id } = useParams();

  async function sendMessage() {
    await axios.post(`${API}/room/${id}`, {
      message,
    });
    client.publish(`room/${id}`, message);
    setMessage("");
  }

  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get(`${API}/room/${id}`);
      console.log(data);
      setRoom(data.room);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (client) {
      client.subscribe("fuck");
      client.subscribe(`room/${id}`);

      client.on("message", (topic, message) => {
        message = message.toString();
        topic = topic.toString();

        if (topic === `room/${id}`) {
          console.log(topic, message);
          setRoom((x) => ({ ...x, messages: [...x.messages, message] }));
          // setMessages((x) => [...x, message]);
        }
      });
    }
  }, [client]);

  return (
    <div>
      <div> {id} </div>
      <div className="column is-4">
        <input
          className="input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="button" onClick={sendMessage}>
          {" "}
          send{" "}
        </button>
      </div>
      {room.messages &&
        room.messages.map((message, id) => <div key={id}>{message}</div>)}
    </div>
  );
}
