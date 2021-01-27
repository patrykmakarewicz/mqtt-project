const { useState, useEffect } = require("react");

export default function Room({ client }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (client) {
      client.subscribe("fuck");
      client.on("message", (message, topic) => {
        message = message.toString();
        topic = topic.toString();
        console.log(message, topic);
      });
    }
  }, [client]);

  return (
    <div>
      <div>room biatch</div>
    </div>
  );
}
