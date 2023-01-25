const express = require('express');
const jwt = require('jsonwebtoken')
const app = express();
const bcrypt = require('bcrypt')
const { User, Kitten } = require('./db');
const { setUser } = require('./middleware/setUser')

require("dotenv").config()
const SINGING_SECRET = process.env.JWT_SECRET
const SALT_COUNT = 10;

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(setUser)

app.get('/', setUser, async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware

// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password
app.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_COUNT)
    const {id} = await User.create({ username, password: hashedPassword })
    const token = jwt.sign({ id: id, username }, SINGING_SECRET)
    res.send({"message": "success", token})
  } catch(error){
    next()
  }
})

// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB
app.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({where: {username}})
    // Hash password
    const result = await bcrypt.compare(password, user.password)
    if (!result) {
      res.sendStatus(401)
    } else {
      const token = jwt.sign({ id: user.id, username }, SINGING_SECRET)
      res.send({"message": "success", token})
    }
  } catch(error){
    next()
  }
})

// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get('/kittens/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const userData = req.user
    if (!userData){
      res.sendStatus(401)
    } else if (id != userData.id) {
      res.sendStatus(401)
    } else {
      const kitten = await Kitten.findOne({where: {ownerId: userData.id}})
      const cleanedData = { name: kitten.name, age: kitten.age, color: kitten.color }
      res.send(cleanedData)
    }
  } catch(error){
    next()
  }
})

// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post('/kittens', async (req, res, next) => {
  try {
    const kittenData = req.body
    const userData = req.user
    if (!userData){
      res.sendStatus(401)
    } else {
      // kittenData["ownerId"] = userData.id
      await Kitten.create(kittenData)
      res.status(201).send(kittenData)
    }
  } catch(error){
    next()
  }
})

// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete('/kittens/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const userData = req.user
    if (!userData){
      res.sendStatus(401)
    } else if (id != userData.id) {
      res.sendStatus(401)
    } else {
      await Kitten.destroy({where: {ownerId: userData.id}})
      res.sendStatus(204)
    }
  } catch(error){
    next()
  }
})

// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
