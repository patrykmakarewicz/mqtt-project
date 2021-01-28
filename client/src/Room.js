import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const EXPRESS_PORT = 8000;
const API = `http://localhost:${EXPRESS_PORT}`;

function Join({ joinRoom }) {
  const [nick, setNick] = useState("");

  return (
    <div>
      <input
        className="input has-text-centered mb-5"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        placeholder="enter your nick"
      />
      <div className="has-text-centered">
        <button className="button" onClick={() => joinRoom(nick)}>
          join
        </button>
      </div>
    </div>
  );
}

function generateBoard() {
  const arr = [];

  let y = 8;
  const x = 6;

  for (let i = 0; i < y; i++) {
    const xd = [];
    for (let j = 0; j < x; j++) {
      xd.push("");
    }
    arr.push(xd);
  }

  return arr;
}

function Board() {
  const [pos, setPos] = useState({ level: 0, x: 5, y: 1 });

  function move(n) {
    const x = { ...pos };

    if (x.level == 0) {
      x.x += n;
      n = 0;
      if (x.x >= 5) {
        n = x.x - 5;
        x.x = 5;
        x.level += 1;
      }
    }
    if (x.level == 1) {
      x.y += n;
      n = 0;
      if (x.y >= 7) {
        n = x.y - 7;
        x.y = 7;
        x.level += 1;
      }
    }
    if (x.level == 2) {
      x.x -= n;
      n = 0;
      if (x.x <= 0) {
        n = -x.x;
        x.x = 0;
        x.level += 1;
      }
    }
    if (x.level == 3) {
      x.y -= n;
      n = 0;
      if (x.y <= 0) {
        n = -x.y;
        x.y = 0;
        x.level = 0;
      }
    }
    setPos(x);
  }

  const [board, setBoard] = useState(generateBoard());

  useEffect(() => {
    setBoard(() => {
      const newBoard = generateBoard();
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (pos.x == j && pos.y == i) {
            newBoard[i][j] = "x";
          }
        }
      }
      return newBoard;
    });
  }, [pos]);

  return (
    <div>
      <button onClick={() => move(1)}> click </button>
      <table align="center" width="400" height="200" border="1">
        {board.map((i, idx) => {
          return (
            <tbody key={idx}>
              <tr>
                {i.map((j, idx2) => {
                  return (
                    <td key={idx2} width="50" height="50" bgcolor="white">
                      {j}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          );
        })}
      </table>
    </div>
  );
}

export default function Room({ client }) {
  const [room, setRoom] = useState({});
  const [auth, setAuth] = useState(false);
  const [error, setError] = useState("");
  const [nick, setNick] = useState("");

  const [message, setMessage] = useState("");
  const { id } = useParams();

  function formatMessage(message) {
    return `${nick}: ${message}`;
  }

  async function sendMessage() {
    if (message.replace(/\s/g, "").length == 0) return;
    await axios.post(`${API}/room/add-message`, {
      id,
      message: formatMessage(message),
    });
    client.publish(`room/${id}`, formatMessage(message));
    setMessage("");
  }

  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get(`${API}/room/${id}`);
      setRoom(data.room);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (client) {
      client.subscribe("fuck");
      client.subscribe(`room/${id}`);
      client.subscribe(`room/${id}/update`);

      client.on("message", (topic, message) => {
        message = message.toString();
        topic = topic.toString();

        if (topic === `room/${id}`) {
          console.log(topic, message);
          setRoom((x) => ({ ...x, messages: [...x.messages, message] }));
        }

        if (topic === `room/${id}/update`) {
          setRoom(JSON.parse(message));
        }
      });
    }
  }, [client]);

  async function joinRoom(nick) {
    const { data } = await axios.post(`${API}/room/add-user`, {
      id,
      nick,
    });
    if (data.success) {
      window.addEventListener("beforeunload", () => {
        axios.post(`${API}/room/remove-user`, {
          id,
          nick,
        });
      });
      setAuth(true);
      setNick(nick);
    } else {
      setError("nick taken");
    }
  }

  async function joinTeamX() {
    await axios.post(`${API}/room/assign-player1`, {
      id,
      nick,
    });
  }

  async function joinTeamY() {
    await axios.post(`${API}/room/assign-player2`, {
      id,
      nick,
    });
  }

  return (
    <div>
      {auth ? (
        <div>
          <div> {nick} </div>
          {room.gameStarted && <Board />}
          <div>
            <button
              className="button"
              disabled={room.player1}
              onClick={joinTeamX}
            >
              {" "}
              Join Team X
            </button>
            {room.player1}
          </div>
          <div>
            <button
              className="button"
              disabled={room.player2}
              onClick={joinTeamY}
            >
              {" "}
              Join Team Y
            </button>
            {room.player2}
          </div>
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
          {room &&
            room.messages.map((message, id) => <div key={id}>{message}</div>)}
        </div>
      ) : (
        <div className="column is-4 is-offset-4 box">
          <div className="subtitle is-3 has-text-centered has-text-danger">
            {error}
          </div>
          <Join joinRoom={joinRoom} />
        </div>
      )}
    </div>
  );
}
