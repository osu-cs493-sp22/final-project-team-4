const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const UserSchema = {
    userId: {required: true},
    name: { required: true },
    email: { required: true, unique: true },
    password: { required: true },
    role: { required: true, default: "student" }, //can be 'admin', 'instructor', or 'student'
}
exports.UserSchema = UserSchema

//add new user
exports.insertNewUser = async function insertNewUser(user){
    const db = getDbReference()
    const collection = db.collection('users')

    user = extractValidFields(user, UserSchema)
    const result = await collection.insertOne(user)
    return result.insertedId
}

//get user by id
exports.getUserById = async function getUserById(userid){
    const db = getDbReference()
    const collection = db.collection('users')
    const classCollection = db.collection('courses')
    const users = await collection.find({
        userId: userid
    }).toArray()
    if(users[0]){ //if a user exists
        if(users[0].role === "instructor"){ //if its an instructor add courses they teach
            let curClasses = []
            const classes = await classCollection.find().toArray() // get list of classes
            classes.forEach(eachClass => {
                // console.log("==eachClass", eachClass)
                if (users[0].userId == eachClass.instructorId){
                    curClasses.push(eachClass.courseId)
                    // console.log("==pushed==")
                }
            })
            users[0].classes = curClasses
            return users[0]
        }
        
        else if(users[0].role === "student"){ //if user is student add all their classes
            let curClasses = []
            const classes = await classCollection.find().toArray() //has a list of all classes
            classes.forEach(eachClass => { //looks at each class
                eachClass.liststudent.forEach(student => { //looks all students in student list
                    if(users[0].userId == student){
                        curClasses.push(eachClass.courseId)
                    }
                })
            });
            users[0].classes = curClasses
            return users[0]
        }

        else{// if its an admin
            return users[0]
        }
    }else{
        return users[0]
    }
}

exports.getUserByEmail = async function(userEmail){
    const db = getDbReference()
    const collection = db.collection('users')
    const users = await collection.find({
        email: userEmail
    }).toArray()
    return users[0]
}

exports.bulkInsertNewUsers = async function(users) {
    const db = getDbReference()
    const collection = db.collection('users')
    const result = await collection.insertMany(users)
    return result.insertedIds
}