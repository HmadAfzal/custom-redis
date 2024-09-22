const net = require("net");
const Parser = require("redis-parser");

const port = 8314;
const store = {};

const server = net.createServer((connection) => {
  console.log("Client connected");
  connection.on("data", (data) => {
    const parser = new Parser({
      returnReply: (reply) => {
        const command = reply[0];
        switch (command) {
          case "set":
            {
              const key = reply[1];
              const value = reply[2];
              store[key] = value;
              connection.write("+Ok\r\n");
            }
            break;
          case "get": {
            const key = reply[1];
            const value = store[key];
            if (!value) connection.write("$-1\r\n");
            else connection.write(`$${value.length}\r\n${value}\r\n`);
          }
        }
      },
      returnError: (error) => {
        console.log(error);
      },
    });
    parser.execute(data);
  });
});

server.listen(port, () => {
  console.log(`TCP server running at port ${port}`);
});
