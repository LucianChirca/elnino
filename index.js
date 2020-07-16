const express = require('express')
const app = express()
const port = 3000
const localIp = '192.168.1.7'
var sqlite3 = require('sqlite3')
var db = new sqlite3.Database('database')
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()


initTables()




function initTables(){
  db.serialize(function () {
  /*

  Priority goes from 0 to 2, 0 being highest priority

  */

  db.run('DROP TABLE IF EXISTS todoItems')
  db.run('DROP TABLE IF EXISTS todoItemsCategory')

  db.run('CREATE TABLE IF NOT EXISTS todoItems (id INTEGER  PRIMARY KEY AUTOINCREMENT, title TEXT, notes TEXT, dueDate INTEGER, categoryId INTEGER, priority INTEGER, repeatType TEXT, done INTEGER DEFAULT 0, FOREIGN KEY(categoryId) REFERENCES todoItemsCategory(id))')
  db.run('CREATE TABLE IF NOT EXISTS todoItemsCategory (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, color TEXT)')

  var stmt = db.prepare('INSERT INTO todoItemsCategory(title, color) VALUES (?,?)')
  stmt.run("UNI", "#ADD8E6")
  stmt.finalize()

  stmt = db.prepare('INSERT INTO todoItems(title, dueDate, categoryId, priority, repeatType, done) VALUES (?,?,?,?,?,?)')
  stmt.run("Do homework", Date.now(), 1, null, "ONCE", 1)
  stmt.run("Run", Date.now(), 1, 2, "ONCE", 0)
  stmt.run("Work for el nino", Date.now(), 1, 0, "ONCE", 0)
  stmt.finalize()
})
}

function getAllTodoItems(callback){
  db.serialize(function () {
    db.all('SELECT td.id, td.title, td.notes, td.dueDate, tdc.title as category, td.priority, td.repeatType, tdc.color, td.done FROM todoItems as td, todoItemsCategory as tdc WHERE td.categoryId == tdc.id',[], function (err, dbRes) {
      if (err){
        throw err
      }
      let result = []
      dbRes.forEach((row)=>{
        result.push(row)
      })
      return callback(result)
    })
  })
}

function addTodoItems(todoItems,callback){
  db.serialize(function () {
    stmt = db.prepare('INSERT INTO todoItems(title,notes, dueDate, categoryId, priority, repeatType) VALUES (?,?,?,?,?,?)')
    todoItems.forEach((todoItem)=>{
      stmt.run(todoItem.title,todoItem.notes, todoItem.dueDate, todoItem.categoryId, todoItem.priority, todoItem.repeatType)
    })
    stmt.finalize()
    callback("Success!")
  })
}

function deleteItem(id,callback){
  db.serialize(function () {
    db.run(`DELETE FROM todoItems WHERE id=?`, id, function(err) {
    if (err) {
      throw err
    }
    callback("Success!")
});
  })
}

function modifyItem(id,newItem,callback){
  db.serialize(function () {
    let data = [newItem.title, newItem.done, id]
    db.run(`UPDATE todoItems SET title=?,done=? WHERE id = ?`,data, function(err) {
    if (err) {
      throw err
    }
    callback("Success!")
});
  })
}





app.get('/todoItems', function(req, res){
  getAllTodoItems(function(result){
    res.send(result)
  })
})

app.post('/todoItems',jsonParser, function(req, res){
  let reqBody = req.body
  if (!Array.isArray(reqBody)){
    res.status(400).send("Body must be an array!")
    return
  }
  addTodoItems(reqBody, function(result){
    res.send(result)
  })
})

app.put('/todoItems/:id', jsonParser, function(req, res){
  console.log(req.body)
  modifyItem(req.params.id, req.body, function(result){
    res.send(result)
  })
})

app.delete('/todoItems/:id', function(req, res){
  deleteItem(req.params.id, function(result){
    res.send(result)
  })
})


app.listen(port, localIp)

process.on('exit', function() {
  db.close()
});
