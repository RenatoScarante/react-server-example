require("dotenv").config();

const jsonServer = require("json-server");
const bodyParser = require("body-parser");

const { createToken, verifyToken, isAuthenticated } = require("./jwt/jwt");

const server = jsonServer.create();
const router = jsonServer.router(require("./db/db.js")());
const db = router.db;

server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

function round(value, decimals) {
  return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

// POST /api/auth/login
server.post(process.env.ROUTE_AUTHENTICATION, (req, res) => {
  const { email, password } = req.body;
  const user = isAuthenticated({ email, password });

  if (user === undefined) {
    const status = 401;
    const message = "Incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }

  db.get("user")
    .getById(user.id)
    .assign({ lastLogin: new Date() })
    .write();

  const token = createToken({ email, password });
  res.status(200).json({ user, token });
});

// POST /api/user
server.post(process.env.ROUTE_USER_POST, (req, res) => {
  var newUser = ({ name, email, cpf, password } = req.body);

  var user = db
    .get("user")
    .find({ name: name } || { email: email } || { cpf: cpf })
    .value();

  if (user !== undefined) {
    const status = 401;
    const message = "User exists";
    res.status(status).json({ status, message });
    return;
  }

  newUser = {
    ...newUser,
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleDateString()
  };

  newUser = db
    .get("user")
    .insert(newUser)
    .value();

  newUser = { ...newUser, password: null };

  const token = createToken({ email, password });

  res.status(200).json({ user: newUser, token });
});

server.use(/^(?!\/auth).*$/, (req, res, next) => {
  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    const status = 401;
    const message = "Bad authorization header";
    res.status(status).json({ status, message });
    return;
  }
  try {
    const token = req.headers.authorization.split(" ")[1];
    verifyToken(token);
    next();
  } catch (err) {
    const status = 401;
    const message = "Error: access_token is not valid";
    res.status(status).json({ status, message });
  }
});

// GET /api/user/:id
server.get(process.env.ROUTE_USER_GET, (req, res) => {
  var id = req.params.id;

  var user = db
    .get("user")
    .getById(id)
    .value();

  if (user === undefined) {
    const status = 401;
    const message = "User not exists";
    res.status(status).json({ status, message });
    return;
  }

  res.status(200).json({ user: user });
});

server.use("/api", router);

const port = process.env.PORT ? process.env.PORT : 5000;

server.listen(port, () => {
  console.log(`Keeping Server is running on port ${port}`);
});
