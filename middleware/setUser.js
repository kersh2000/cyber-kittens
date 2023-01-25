const jwt = require('jsonwebtoken');
require("dotenv").config()
const SINGING_SECRET = process.env.JWT_SECRET

const setUser = (req, res, next) => {
  // Receive request object
  try{
    const auth = req.header('Authorization')
    if (!auth) {
      next()
    } else {
      const [, token] = auth.split(" ")
      const payload = jwt.verify(token, SINGING_SECRET)
      req.user = payload
      next()
    }
  } catch (error){
    next()
  }
}

module.exports = {setUser}