# Building Your Own Redis

Creating your own version of Redis involves understanding several key concepts and components. This guide outlines the essential elements you'll need to consider.

## Table of Contents
1. [What is Redis?](#what-is-redis)
2. [Understanding TCP Protocol](#understanding-tcp-protocol)
3. [Redis Serialization Protocol (RESP)](#redis-serialization-protocol-resp)
4. [Building the RESP Server](#building-the-resp-server)
5. [Handling GET and SET Commands](#handling-get-and-set-commands)

---

## 1. What is Redis?
[Redis](https://redis.io/docs/latest/develop/get-started/) is an in-memory data store widely used by millions of developers for various applications, including caching, vector databases, document databases, streaming engines, and message brokers. Redis offers built-in replication, various levels of on-disk persistence, and supports complex data types such as strings, hashes, lists, sets, sorted sets, and JSON, along with atomic operations on these data types.

## 2. Understanding TCP Protocol
[TCP (Transmission Control Protocol)](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) is a core protocol of the Internet Protocol Suite, providing reliable communication between networked devices. It ensures that data is transmitted accurately and in the correct order.

## 3. Redis Serialization Protocol (RESP)
The [Redis Serialization Protocol (RESP)](https://redis.io/docs/latest/develop/reference/protocol-spec/) is the wire protocol used by clients to communicate with the Redis server. While designed specifically for Redis, RESP can also be adapted for other client-server applications.

## 4. Building the RESP Server

Below is a simple implementation of a RESP server using Node.js. In this implementation, we:

- We initialized an empty object to act as our in-memory key-value store.
- We set up a TCP server to listen for client connections.
- When a client connects, we begin handling incoming data from that connection.
- We parse the incoming commands, such as SET and GET, and respond accordingly based on the Redis Serialization Protocol (RESP).
- Depending on the command's outcome, we send back the appropriate responses, following RESP format.

```javascript
const net = require("net");
const Parser = require("redis-parser");

const port = 8314;
const store = {}; // In-memory storage for key-value pairs

// Create the TCP server
const server = net.createServer((connection) => {
  console.log("Client connected");

  // Handle incoming data
  connection.on("data", (data) => {
    const parser = new Parser({
      returnReply: (reply) => {
        const command = reply[0].toLowerCase();
        switch (command) {
          case "set": {
            const key = reply[1];
            const value = reply[2];
            if (key && value) {
              store[key] = value; // Store key-value in memory
              connection.write("+OK\r\n"); // Redis standard response for success
            } else {
              connection.write("-ERR wrong number of arguments for 'set' command\r\n");
            }
            break;
          }
          case "get": {
            const key = reply[1];
            const value = store[key];
            if (value) {
              connection.write(`$${value.length}\r\n${value}\r\n`); // Send the value back
            } else {
              connection.write("$-1\r\n"); // Key not found
            }
            break;
          }
          default:
            connection.write("-ERR unknown command\r\n");
        }
      },
      returnError: (error) => {
        console.log(error);
        connection.write(`-ERR ${error.message}\r\n`); // Handle errors
      },
    });

    try {
      parser.execute(data); // Parse and execute the received data
    } catch (error) {
      connection.write(`-ERR ${error.message}\r\n`);
    }
  });

  // Handle connection end
  connection.on("end", () => {
    console.log("Client disconnected");
  });

  // Handle connection errors
  connection.on("error", (err) => {
    console.error("Connection error:", err);
  });
});

// Start listening on the specified port
server.listen(port, () => {
  console.log(`TCP server running at port ${port}`);
});
```

## Handling GET and SET Commands
The server can now handle basic Redis commands like SET and GET. The data is stored in memory, and responses follow the RESP format.