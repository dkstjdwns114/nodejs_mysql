let db = require("./db.js");
let template = require("./template.js");

exports.home = function (request, response) {
  db.query(`SELECT * FROM topic`, function (error, topics) {
    let title = "Welcome";
    let description = "Hello, Node.js";
    let list = template.list(topics);
    let html = template.HTML(
      title,
      list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    response.writeHead(200);
    response.end(html);
  });
};
