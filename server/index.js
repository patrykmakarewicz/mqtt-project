const express = require("express");
require("dotenv").config();
const { startBroker } = require("./broker");

const app = express();

app.use(require("cors")());

class Room {
  constructor(id) {
    this.id = id;
    this.messages = [];
    this.player1 = null;
    this.player2 = null;
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
}

class Game {
  constructor() {
    this.rooms = [];
  }

  getById(id) {
    this.rooms.find((room) => room.id == id);
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
}

app.get("/create-room", (req, res) => {
  console.log(req, res);
  res.send({ success: true });
});

const port = process.env.EXPRESS_PORT;

startBroker();
app.listen(port, () => console.log(`listening on port ${port}`));
