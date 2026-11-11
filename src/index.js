require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const db = require("./db/database");
const routes = require("./routes/routes");

db();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log('Server is running on port http://localhost:%d', port);
});

module.exports = app;