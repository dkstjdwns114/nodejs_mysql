let http = require("http");
let url = require("url");
let qs = require("querystring");
let template = require("./lib/template.js");
let db = require("./lib/db.js");
let topic = require("./lib/topic.js");

let app = http.createServer(function (request, response) {
  let _url = request.url;
  let queryData = url.parse(_url, true).query;
  let pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
      topic.home(request, response);
    } else {
      topic.page(request, response);
    }
  } else if (pathname === "/create") {
    topic.create(request, response);
  } else if (pathname === "/create_process") {
    topic.create_process(request, response);
  } else if (pathname === "/update") {
    db.query("SELECT * FROM topic", function (error, topics) {
      if (error) {
        throw error;
      }
      db.query(
        `SELECT * FROM topic WHERE id=?`,
        [queryData.id],
        function (error2, topic) {
          if (error2) {
            throw error2;
          }
          db.query(`SELECT * FROM author`, function (error2, authors) {
            let list = template.list(topics);
            let html = template.HTML(
              topic[0].title,
              list,
              `
              <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${topic[0].id}">
                <p><input type="text" name="title" placeholder="title" value="${
                  topic[0].title
                }"></p>
                <p>
                  <textarea name="description" placeholder="description">${
                    topic[0].description
                  }</textarea>
                </p>
                <p>
                  ${template.authorSelect(authors, topic[0].author_id)}
                </p>
                <p>
                  <input type="submit">
                </p>
              </form>
              `,
              `<a href="/create">create</a> <a href="/update?id=${topic[0].id}">update</a>`
            );
            response.writeHead(200);
            response.end(html);
          });
        }
      );
    });
  } else if (pathname === "/update_process") {
    let body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      let post = qs.parse(body);
      db.query(
        `UPDATE topic SET title=?, description=?, author_id=? WHERE id=?`,
        [post.title, post.description, post.author, post.id],
        function (error, result) {
          response.writeHead(302, { Location: `/?id=${post.id}` });
          response.end();
        }
      );
    });
  } else if (pathname === "/delete_process") {
    let body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      let post = qs.parse(body);
      let id = post.id;
      db.query(
        "DELETE FROM topic WHERE id=?",
        [post.id],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/` });
          response.end();
        }
      );
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
