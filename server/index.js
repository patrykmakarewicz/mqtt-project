require("dotenv").config();

const express = require("express");
const shortid = require("shortid");
const { startBroker } = require("./broker");
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
    this.player2 = null;
    this.gameStarted = false;
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
  res.send({ success: true });
});

app.get("/create-room", (req, res) => {
  const room = game.addRoom();
  publisher.publish("rooms", room.id);
  res.send({ success: true, room });
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
