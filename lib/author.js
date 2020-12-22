let db = require("./db.js");
let template = require("./template.js");

exports.home = function (request, response) {
  db.query(`SELECT * FROM topic`, function (error, topics) {
    db.query(`SELECT * FROM author`, function (error2, authors) {
      let title = "author";
      let list = template.list(topics);
      let html = template.HTML(
        title,
        list,
        `
          ${template.authorTable(authors)}
          <style>
            table {
              border-collapse: collapse;
            }
            td {
              border: 1px solid #ccc;
            }
          </style>
        `,
        `<a href="/create">create</a>`
      );
      response.writeHead(200);
      response.end(html);
    });
  });
};
