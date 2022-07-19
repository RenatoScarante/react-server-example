require("dotenv").config();

const jsonServer = require("json-server");
const bodyParser = require("body-parser");

const server = jsonServer.create();
const router = jsonServer.router(require("./db/db.js")());
const db = router.db;

const personTable = "person";
const relationshipTable = "relationship";

db.defaults({
  personTable: [],
  relationshipTable: []
}).write()

server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

function getPerson(cpf) {
  return db
    .get(personTable)
    .find({ cpf: cpf })
    .value();
}

function responseError(res, status, message) {
  res.status(status).json(message);
}

function responseSuccess(res, message) {
  res.status(200).json(message);
}

// POST /person
server.post(process.env.ROUTE_PERSON_POST, (req, res) => {
  var newPerson = ({ cpf, name } = req.body);

  var cpfLength = newPerson.cpf.length;

  if (cpfLength > 11) {
    responseError(400, "CPF number invalid.");
    return;
  }

  var person = db
    .get(personTable)
    .find({ cpf: cpf } || { name: name })
    .value();

  if (person !== undefined) {
    responseError(res, 400, "Person exists.");
    return;
  }

  newPerson = {
    ...newPerson,
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleDateString()
  };

  newPerson = db
    .get(personTable)
    .insert(newPerson)
    .value();

  responseSuccess(res, "Person success created.");
});

// GET /person/:cpf
server.get(process.env.ROUTE_PERSON_GET, (req, res) => {
  var cpf = req.params.cpf;

  var person = db
    .get(personTable)
    .find({ cpf: cpf })
    .value();

  if (person === undefined) {
    responseError(res, 404, "Person not exists.");
    return;
  }

  responseSuccess(res, { person: person });
});

// POST /relationship
server.post(process.env.ROUTE_RELATIONSHIP, (req, res) => {
  var relationship = ({ cpf1, cpf2 } = req.body);

  if (getPerson(cpf1) === undefined) {
    responseError(res, 404, `CPF ${cpf1} not exists`);
    return;
  }

  if (getPerson(cpf2) === undefined) {
    responseError(res, 404, `CPF ${cpf2} not exists`);
    return;
  }

  db
    .get(relationshipTable)
    .insert(relationship)
    .value();

  responseSuccess(res, "Relationship success created.");
});

// DELETE /clean
server.delete(process.env.ROUTE_CLEAN, (req, res) => {

  db
    .get(personTable)
    .truncate()
    .write();

  db
    .get(relationshipTable)
    .truncate()
    .write();

  responseSuccess(res, "Clean success.");
});

// GET /recommendations/:cpf
server.get(process.env.ROUTE_RECOMMENDATIONS, (req, res) => {
  var cpf = req.params.cpf;

  if (cpf.length > 11) {
    responseError(400, `CPF ${cpf} number invalid.`);
    return;
  }

  var person = db
    .get(personTable)
    .find({ cpf: cpf })
    .value();

  if (person === undefined) {
    responseError(res, 404, `Person ${cpf} not exists.`);
    return;
  }

  var relationship = db
    .get(relationshipTable)
    .find({ cpf1: cpf } || { cpf2: cpf })
    .value();

  if (relationship === undefined) {
    responseError(res, 404, `Person ${cpf} not exists.`);
    return;
  }

  responseSuccess(res, relationship);
});

//server.use("/api", router);

const port = process.env.PORT ? process.env.PORT : 5000;

server.listen(port, () => {
  console.log(`Keeping Server is running on port ${port}`);
});
