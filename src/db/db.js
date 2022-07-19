var user = require("./user.json");
var person = require("./person.json");
var relationship = require("./relationship.json");

module.exports = function () {
  return {
    user: user,
    person: person,
    relationship: relationship
  };
};
