require("dotenv").config();

const express = require("express");
const shortid = require("shortid");
const { startBroker } = require("./broker");
const { removeOutgoingMessage } = require("./publisher");
const publisher = require("./publisher");

const app = express();

app.use(require("cors")());
app.use(express.json());

class Room {
  constructor(id) {
    this.id = id;
    this.messages = [];
    this.users = [];
    this.player1 = null;
    this.player1Moves = 0;
    this.player2Moves = 0;
    this.player1Lap = 0;
    this.player2Lap = 0;
    this.pos1 = { level: 0, x: 0, y: 0 };
    this.startPos1 = { level: 0, x: 0, y: 0 };
    this.startPos2 = { level: 0, x: 5, y: 7 };
    this.player2 = null;
    this.pos2 = { level: 0, x: 5, y: 7 };
    this.gameStarted = false;
    this.gameEnded = false;
    this.move = 0;
    this.note = "";
    this.laps = 2;
  }

  addMessage(message) {
    this.messages = [...this.messages, message];
  }

  assignPlayerOne(nick) {
    this.player1 = nick;
  }

  assignPlayerTwo(nick) {
    this.player2 = nick;
  }

  addUser(nick) {
    this.users = [...this.users, nick];
  }

  removeUser(nick) {
    this.users = this.users.filter((user) => user != nick);
  }

  includesUser(nick) {
    return this.users.includes(nick);
  }
}

class Game {
  constructor() {
    this.rooms = [];
  }

  getById(id) {
    return this.rooms.find((room) => room.id == id);
  }

  removeUser(id, nick) {
    this.getById(id).removeUser(nick);
  }

  includesUser(id, nick) {
    return this.rooms.find((room) => room.id == id).includesUser(nick);
  }

  addUser(id, nick) {
    this.getById(id).addUser(nick);
  }

  addMessage(id, message) {
    this.getById(id).addMessage(message);
  }

  assignPlayerOne(id, nick) {
    this.getById(id).assignPlayerOne(nick);
  }

  assignPlayerTwo(id, nick) {
    this.getById(id).assignPlayerTwo(nick);
  }

  addRoom() {
    const room = new Room(shortid.generate());
    this.rooms.push(room);
    return room;
  }

  getRoomsIds() {
    return this.rooms.map((room) => room.id);
  }

  move(id, n) {
    const room = this.getById(id);
    let x = null;
    let y = null;

    if (room.move == 0) {
      room.player1Moves += n;
      x = room.pos1;
      y = room.pos2;
    } else {
      room.player2Moves += n;
      x = room.pos2;
      y = room.pos1;
    }

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
    if (x.level == 0) {
      x.x += n;
      n = 0;
      if (x.x >= 5) {
        n = x.x - 5;
        x.x = 5;
        x.level += 1;
      }
    }

    if (x.x == y.x && x.y == y.y) {
      if (room.move == 0) {
        room.player2Moves = 0;
        room.player2Lap = 0;
        y.x = room.startPos2.x;
        y.y = room.startPos2.y;
        y.level = room.startPos2.level;
      } else {
        room.player1Lap = 0;
        room.player1Moves = 0;
        y.x = room.startPos1.x;
        y.y = room.startPos1.y;
        y.level = room.startPos1.level;
      }
    }

    if (room.player1Moves >= 24) {
      room.player1Moves = x.x;
      room.player1Lap += 1;
    }

    if (room.player2Moves >= 24) {
      room.player2Moves = 5 - x.x;
      room.player2Lap += 1;
    }

    if (room.player1Lap == room.laps) {
      room.gameEnded = true;
      room.note = "player X won the game!";
    } else if (room.player2Lap == room.laps) {
      room.gameEnded = true;
      room.note = "player Y won the game!";
    }

    if (room.gameEnded) {
      room.gameStarted = false;
    }

    room.move += 1;
    if (room.move == 2) room.move = 0;
  }
}

const game = new Game();

app.get("/rooms", (req, res) => {
  const rooms = game.getRoomsIds();
  res.send({ success: true, rooms });
});

app.get("/room/:id", (req, res) => {
  const room = game.getById(req.params.id);
  res.send({ success: true, room });
});

app.post("/room/add-message", (req, res) => {
  game.addMessage(req.body.id, req.body.message);
  res.send({ success: true });
});

app.post("/room/add-user", (req, res) => {
  if (!game.includesUser(req.body.id, req.body.nick)) {
    game.addUser(req.body.id, req.body.nick);
    res.send({ success: true });
  } else {
    res.send({ success: false });
  }
});

app.post("/room/remove-user", (req, res) => {
  if (game.getById(req.body.id).player1 == req.body.nick) {
    game.getById(req.body.id).player1 = null;
  } else if (game.getById(req.body.id).player2 == req.body.nick) {
    game.getById(req.body.id).player2 = null;
  }
  game.removeUser(req.body.id, req.body.nick);
  publisher.publish(`room/${req.body.id}/update`, JSON.stringify(room));
  res.send({ success: true });
});

app.get("/create-room", (req, res) => {
  const room = game.addRoom();
  publisher.publish("rooms", room.id);
  res.send({ success: true, room });
});

app.post("/room/move", (req, res) => {
  game.move(req.body.id, req.body.n);
  publisher.publish(
    `room/${req.body.id}/update`,
    JSON.stringify(game.getById(req.body.id))
  );
  res.send({ success: true });
});

app.post("/room/assign-player1", (req, res) => {
  if (game.getById(req.body.id).player2 != req.body.nick) {
    game.assignPlayerOne(req.body.id, req.body.nick);
    const room = game.getById(req.body.id);

    if (
      game.getById(req.body.id).player1 &&
      game.getById(req.body.id).player2
    ) {
      game.getById(req.body.id).gameStarted = true;
    }

    publisher.publish(`room/${req.body.id}/update`, JSON.stringify(room));
  }
  res.send({ success: true });
});

app.post("/room/assign-player2", (req, res) => {
  if (game.getById(req.body.id).player1 != req.body.nick) {
    game.assignPlayerTwo(req.body.id, req.body.nick);
    const room = game.getById(req.body.id);

    if (
      game.getById(req.body.id).player1 &&
      game.getById(req.body.id).player2
    ) {
      game.getById(req.body.id).gameStarted = true;
    }

    publisher.publish(`room/${req.body.id}/update`, JSON.stringify(room));
  }
  res.send({ success: true });
});

const port = process.env.EXPRESS_PORT;

startBroker();
app.listen(port, () => console.log(`listening on port ${port}`));
