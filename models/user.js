const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const UserSchema = {
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
    const users = await collection.find({
        _id: new ObjectId(userid)
    }).toArray()
    if(users[0]){ //if a user exists
        if(users[0].role === "instructor"){ //if its an instructor add courses they teach
            const instructors = await collection.aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: "courses",
                        localField: "_id",
                        foreignField: "instructorId",
                        as: "reviews"
                    }
                }
            ]).toArray()

            return instructors[0]
        }
        
        if(users[0].role === "student"){ //if user is student add all their classes
            //not quite sure how to do it as the userid are going to be in a list
            return users[o]
        }
    }else{
        return users[0]
    }
}