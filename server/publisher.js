require("dotenv").config();

const mqtt = require("mqtt");

const port = process.env.BROKER_PORT;

const client = mqtt.connect(`ws://localhost:${port}`);

module.exports = client;