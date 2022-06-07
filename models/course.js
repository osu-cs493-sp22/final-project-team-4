const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

const CourseSchema = {
    courseId: { required: true },
    subject: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorId: { required: true },
    liststudent: { required: true },
    listassignments: { required: true },
}
exports.CourseSchema = CourseSchema

// Compute last page number and make sure page is within allowed bounds.
// Compute offset into collection.
async function getCoursesPage(page) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const count = await collection.countDocuments()

    // Compute last page number and make sure page is within allowed bounds.
    // Compute offset into collection.
    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const results = await collection.find({})
        .sort({ _id: 1 })
        .skip(offset)
        .limit(pageSize)
        .toArray()

    return {
        courses: results,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}
exports.getCoursesPage = getCoursesPage

//add new course id
exports.insertNewCourse = async function insertNewCourse(course) {
    const db = getDbReference()
    const collection = db.collection('courses')

    user = extractValidFields(course, CourseSchema)
    const result = await collection.insertOne(course)
    return result.insertedId
}

//get course by id
exports.getCourseById = async function getCourseById(courseid) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        courseid: courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        return courses[0]
    } else {
        return undefined
    }
}

// delete course by id
exports.deleteCourseById = async function deleteCourseById(courseid) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        courseid: courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        const result = await collection.deleteOne(
            { courseid: courseid },
        );
        if (result.deletedCount == 1) {
            return true
        } else {
            return true
        }
    } else {
        return false
    }
}

// check if course exists by id
exports.checkIfCourseExistById = async function checkIfCourseExistById(courseid) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        "courseid": courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        return true
    } else {
        return false
    }
}

async function getAllStudents(IDList, courseId){
    const db = getDbReference()
    const collection = db.collection('users')
    const studentList = []
    console.log("==IDList", IDList)

    if(IDList.length == 0){
        return []
    }
    else{
        for(i = 0; i < IDList.length; i++){
            const student = await collection.find({
                userId: parseInt(IDList[i])
            }).toArray()

            if(student[0]){
                console.log("pushed: ", student[0])
                studentList.push(student[0])
            }
        }
    }
    return studentList
}

exports.getStudentRoster = async function getStudentRoster(courseId){
    const db = getDbReference()
    const collection = db.collection('courses')
    // const studentList = []
    const courses = await collection.find({
        courseId: parseInt(courseId)
    }).toArray()
    console.log("==courses", courses[0])
    if(courses[0]){
        const studentList = await getAllStudents(courses[0].liststudent, courseId)
        return studentList
        // await courses[0].liststudent.forEach(async eachStudent => {
        //     // console.log("inside forEach")
        //     const student = await studentColleciton.find({
        //         userId: eachStudent
        //     }).toArray()
        //     if(student[0]){
        //         console.log("==student[0]", student[0])
        //         // console.log("pushed")
        //         studentList.push(student[0])
        //     }
        // });
    }
    return []
}

async function bulkInsertNewCourses(courses) {
    const coursesToInsert = courses.map(function (course) {
        return extractValidFields(course, CourseSchema)
    })
    const db = getDbReference()
    const collection = db.collection('courses')
    const result = await collection.insertMany(coursesToInsert)
    return result.insertedIds
}
exports.bulkInsertNewCourses = bulkInsertNewCourses


// TODO: FIXME:
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

