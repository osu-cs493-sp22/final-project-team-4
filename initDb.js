const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewUsers } = require('./models/user')

const userData = require('./data/users.json')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {
   
    //bulk insert users into database
    /*
      user 1 is an admin
      users 2-6 are instructors
      users 7-11 are students
    */
    const ids = await bulkInsertNewUsers(userData)
    console.log("== Inserted users with IDs:", ids)
  
    
    if (mongoCreateUser && mongoCreatePassword) {
      const db = getDbReference()
      const result = await db.addUser(mongoCreateUser, mongoCreatePassword, {
        roles: "readWrite"
      })
      console.log("== New user created:", result)
      console.log("== New user", mongoCreateUser)
      console.log("== New password", mongoCreatePassword)
    }
  
    closeDbConnection(function () {
      console.log("== DB connection closed")
    })
  })