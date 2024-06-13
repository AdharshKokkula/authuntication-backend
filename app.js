const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'userData.db')
let database = null

const initializeDatabaseAndServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('\nServer is Running at: http://localhost:3000\n')
    })
  } catch (error) {
    console.log(error)
  }
}

initializeDatabaseAndServer()

app.get('/register', async (request, response) => {
  const sqlGetQuery = `select * from user;`
  const results = await database.all(sqlGetQuery)
  response.send(results)
})

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const sqlGetQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userData = await database.get(sqlGetQuery)
  if (userData === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const sqlInsertQuery = `INSERT INTO user VALUES('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`
      await database.run(sqlInsertQuery)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const sqlGetQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userData = await database.get(sqlGetQuery)
  if (userData === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, userData.password)
    if (!isPasswordCorrect) {
      response.status(400)
      response.send('Invalid password')
    } else {
      response.status(200)
      response.send('Login success!')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const sqlGetQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userData = await database.get(sqlGetQuery)
  const isPasswordCorrect = await bcrypt.compare(oldPassword, userData.password)
  if (!isPasswordCorrect) {
    response.status(400)
    response.send('Invalid current password')
  } else {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const sqlUpdateQuery = `UPDATE user SET password = '${hashedPassword}' WHERE username = '${username}';`
      await database.run(sqlUpdateQuery)
      response.status(200)
      response.send('Password updated')
    }
  }
})

module.exports = app
