import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import React from "react";

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

function Board({ room, move }) {
  const [board, setBoard] = useState(generateBoard());

  useEffect(() => {
    setBoard(() => {
      const newBoard = generateBoard();
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
          if (room.pos1.x == j && room.pos1.y == i) {
            newBoard[i][j] = "X";
          }
          if (room.pos2.x == j && room.pos2.y == i) {
            if (newBoard[i][j] == "X") {
              newBoard[i][j] = "Y, X";
            } else {
              newBoard[i][j] = "Y";
            }
          }
        }
      }
      return newBoard;
    });
  }, [room]);

  function color(idx, idx2) {
    if (idx == 0 && idx2 == 0) return "aquamarine";
    if (idx == 7 && idx2 == 5) return "red";
    if (idx > 0 && idx < 7 && idx2 > 0 && idx2 < 5) return "grey";
  }

  return (
    <div>
      <table align="center" width="400" height="200" border="1">
        {board.map((i, idx) => {
          return (
            <tbody key={idx}>
              <tr>
                {i.map((j, idx2) => {
                  return (
                    <td
                      key={idx2}
                      width="50"
                      height="50"
                      bgcolor={color(idx, idx2)}
                    >
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
  const [number, setNumber] = useState(0);
  const [chatContainer, setChatContainer] = useState(React.createRef());

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
    scroll();
  }

  useEffect(() => {
    async function fetchData() {
      const { data } = await axios.get(`${API}/room/${id}`);
      setRoom(data.room);
    }
    fetchData();

    return () => {
      axios.post(`${API}/room/remove-user`, {
        id,
        nick,
      });
    };
  }, [nick]);

  useEffect(() => {
    if (client) {
      client.subscribe(`room/${id}`);
      client.subscribe(`room/${id}/update`);

      client.on("message", (topic, message) => {
        message = message.toString();
        topic = topic.toString();

        if (topic === `room/${id}`) {
          setRoom((x) => ({ ...x, messages: [...x.messages, message] }));
        }

        if (topic === `room/${id}/update`) {
          setRoom(JSON.parse(message));
        }
      });
    }
  }, [client]);

  async function joinRoom(nick) {
    if (nick.replace(/\s/g, "").length == 0) return;
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

  function randomNumber() {
    setNumber(Math.floor(Math.random() * 6) + 1);
  }

  async function move() {
    await axios.post(`${API}/room/move`, { id, n: number });
    setNumber(0);
  }

  function scroll() {
    if (chatContainer) {
      const scroll =
        chatContainer.current.scrollHeight - chatContainer.current.clientHeight;
      chatContainer.current.scrollTo(0, scroll);
    }
  }

  return (
    <div>
      {auth ? (
        <div>
          <div>
            <button
              className="button"
              disabled={room.player1}
              onClick={joinTeamX}
            >
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
          {room.gameStarted && (
            <div className="has-text-centered subtitle is-4">
              <div>player X lap: {room.player1Lap}</div>
              <div>player Y lap: {room.player2Lap}</div>
              <div>{room.move == 0 ? "player X move" : "player Y move"}</div>
              {room.move == 0 && room.player1 == nick && (
                <div>
                  {number == 0 && (
                    <button onClick={randomNumber} className="button">
                      {" "}
                      roll{" "}
                    </button>
                  )}
                  {number > 0 && (
                    <div>
                      <div>
                        <button onClick={move} className="button">
                          {" "}
                          move by {number}{" "}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {room.move == 1 && room.player2 == nick && (
                <div>
                  {number == 0 && (
                    <button onClick={randomNumber} className="button">
                      {" "}
                      roll{" "}
                    </button>
                  )}
                  {number > 0 && (
                    <div>
                      <div>
                        <button onClick={move} className="button">
                          move by {number}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Board room={room} />
            </div>
          )}

          {room.gameEnded && (
            <div class="has-text-centered">
              <div className="subtitle is-3 mb-3">{room.note}</div>
              <Board room={room} />
            </div>
          )}
          <div className="column is-2">
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
          <div
            ref={chatContainer}
            style={{
              height: "300px",
              overflowY: "scroll",
              border: "1px solid black",
            }}
            className="column is-4"
          >
            {room &&
              room.messages.map((message, id) => (
                <div
                  key={id}
                  style={{
                    backgroundColor: id % 2 == 0 ? "rgb(230,230,230)" : "white",
                  }}
                >
                  {message}
                </div>
              ))}
          </div>
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
