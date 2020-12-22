let http = require("http");
let fs = require("fs");
let url = require("url");
let qs = require("querystring");
let template = require("./lib/template.js");
let path = require("path");
let sanitizeHtml = require("sanitize-html");
let mysql = require("mysql");
let db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "test"
});

db.connect();

let app = http.createServer(function (request, response) {
  let _url = request.url;
  let queryData = url.parse(_url, true).query;
  let pathname = url.parse(_url, true).pathname;
  if (pathname === "/") {
    if (queryData.id === undefined) {
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
    } else {
      db.query(`SELECT * FROM topic`, function (error, topics) {
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
            let title = topic[0].title;
            let description = topic[0].description;
            let list = template.list(topics);
            let html = template.HTML(
              title,
              list,
              `<h2>${title}</h2>${description}`,
              ` <a href="/create">create</a>
                <a href="/update?id=${queryData.id}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${queryData.id}">
                  <input type="submit" value="delete">
                </form>`
            );
            response.writeHead(200);
            response.end(html);
          }
        );
      });
    }
  } else if (pathname === "/create") {
    db.query(`SELECT * FROM topic`, function (error, topics) {
      let title = "Create";
      let list = template.list(topics);
      let html = template.HTML(
        title,
        list,
        `
        <form action="/create_process" method="post">
          <p><input type="text" name="title" placeholder="title"></p>
          <p>
            <textarea name="description" placeholder="description"></textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
        `<a href="/create">create</a>`
      );
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === "/create_process") {
    let body = "";
    request.on("data", function (data) {
      body = body + data;
    });
    request.on("end", function () {
      let post = qs.parse(body);
      db.query(
        `INSERT INTO topic (title, description, created, author_id) VALUES(?, ?, NOW(), ?)`,
        [post.title, post.description, 1],
        function (error, result) {
          if (error) {
            throw error;
          }
          response.writeHead(302, { Location: `/?id=${result.insertId}` });
          response.end();
        }
      );
    });
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
          let list = template.list(topics);
          let html = template.HTML(
            topic[0].title,
            list,
            `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${topic[0].id}">
              <p><input type="text" name="title" placeholder="title" value="${topic[0].title}"></p>
              <p>
                <textarea name="description" placeholder="description">${topic[0].description}</textarea>
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
        `UPDATE topic SET title=?, description=?, author_id=1 WHERE id=?`,
        [post.title, post.description, post.id],
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
      let filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      });
    });
  } else {
    response.writeHead(404);
    response.end("Not found");
  }
});
app.listen(3000);
