const { connectToDb, getDbReference, closeDbConnection } = require('./lib/mongo')
const { bulkInsertNewUsers } = require('./models/user')
const { bulkInsertNewCourses } = require('./models/course')

const coursesData = require('./data/courses.json')
const userData = require('./data/users.json')
const assignmentData = require('./data/assignments.json')
const { bulkInsertNewAssignments } = require('./models/assignment')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD

connectToDb(async function () {

  //bulk insert users into database
  /*
    user 1 is an admin
    users 2-6 are instructors
    users 7-11 are students
  */
  const userIds = await bulkInsertNewUsers(userData)
  console.log("== Inserted users with IDs:", userIds)

  /*
   * Insert initial courses data into the database
   */
  const courseIds = await bulkInsertNewCourses(coursesData)
  console.log("== Inserted courses with IDs:", courseIds)

  /*
   * Insert initial assignments data into the database
   */
  const assignmentIds = await bulkInsertNewAssignments(assignmentData)
  console.log("== Inserted assignments with IDs:", assignmentIds)


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