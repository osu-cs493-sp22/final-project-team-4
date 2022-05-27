const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const CourseSchema = {
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorid: { required: true },
    liststudent: { required: true },
    listassignments: { required: true },
}
exports.CourseSchema = CourseSchema

//add new course id
exports.insertNewCourse = async function insertNewCourse(course) {
    const db = getDbReference()
    const collection = db.collection('course')

    user = extractValidFields(course, CourseSchema)
    const result = await collection.insertOne(course)
    return result.insertedId
}

//get course by id
exports.getCourseById = async function getCourseById(courseid) {
    const db = getDbReference()
    const collection = db.collection('course')
    const courses = await collection.find({
        _id: new ObjectId(courseid)
    }).toArray()
    if (courses[0]) { //if a course exists
        return courses[0]
    } else {
        return undefined
    }
}

//remove course id 


// possibly required functions

// get course subject from given course in the database
// add course subject
// remove course subject

// get course number from given course in the database
// add course number
// remove course number

// get course title from given course in the database
// add course title 
// remove course title

// get term id from given course in the database
// add term id
// remove term id

// get Instructor id from given course in the database
// add instructor id 
// remove instructor id

// get List of Students taking the course
// Add to the list of students (check for usertype)
// remove student from usersList (check for usertype)

// get list of assignments from the course
// add assignment to course database 
// remove assignment from course in the database

