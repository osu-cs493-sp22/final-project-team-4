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

    const newResults = []
    results.forEach(course => {
        const newObject = {
            courseId: course.courseId,
            subject: course.subject,
            number: course.number,
            title: course.title,
            term: course.term,
            instructorId: course.instructorId,
        }
        newResults.push(newObject)
    })

    return {
        courses: newResults,
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

    course = extractValidFields(course, CourseSchema)
    course.liststudent = []
    course.listassignments = []
    const result = await collection.insertOne(course)
    return result.insertedId
}

//get course by id
exports.getCourseById = async function getCourseById(courseid) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        courseId: courseid
    }).toArray()
    console.log("==courses[0] in getCourseById", courses[0])
    if (courses[0]) { //if a course exists
        const strippedCourse = {
            subject: courses[0].subject,
            number: courses[0].number,
            title: courses[0].title,
            term: courses[0].term,
            instructorId: courses[0].instructorId,
        }
        return strippedCourse
    } else {
        return null
    }
}

// delete course by id
exports.deleteCourseById = async function deleteCourseById(courseid) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        courseId: courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        const result = await collection.deleteOne(
            { courseId: courseid },
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

// patch a course
exports.patchCourseById = async function patchCourseById(courseId, body){
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        courseId: courseId
    }).toArray()
    if(courses[0]){
        const result = await collection.updateOne(
            { courseId: courseId },
            { $set: {
                subject: body.subject,
                number: body.number,
                title: body.title,
                term: body.term,
                instructorId: body.instructorId
            }}
        )
        return result.matchedCount > 0
    }
}

// update course by id
exports.updateCourseById = async function updateCourseById(courseid, course) {
    const db = getDbReference()
    const collection = db.collection('courses')
    const courses = await collection.find({
        // _id: new ObjectId(courseid)
        courseId: courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        const result = await collection.deleteOne(
            { courseId: courseid },
        );
        if (result.deletedCount == 1) {
            // add new course
            const result = await collection.insertOne(course)
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
        "courseId": courseid
    }).toArray()
    if (courses[0]) { //if a course exists
        return true
    } else {
        return false
    }
}

async function getAllAssignments(IDList){
    const db = getDbReference()
    const collection = db.collection('assignments')
    const assignmentList = []
    console.log("==IDList", IDList)
    if(IDList){
        if(IDList.length == 0){
            return []
        }
        else{
            for(i = 0; i < IDList.length; i++){
                const assignment = await collection.find({
                    assignmentId: parseInt(IDList[i])
                }).toArray()
    
                if(assignment[0]){
                    console.log("pushed: ", assignment[0])
                    assignmentList.push(assignment[0])
                }
            }
        }
        return assignmentList
    }else{
        return null
    }
    
}

async function getAllStudents(IDList){
    const db = getDbReference()
    const collection = db.collection('users')
    const studentList = []
    console.log("==IDList", IDList)
    if(IDList){
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
    }else{
        return null
    }
    
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
        if(studentList){
            console.log("returning list")
            return studentList
        }else{
            console.log("returning empty")
            return []
        }        
    }else{
        console.log("returning null")
        return null
    }
}

exports.getAssignmentList = async function getAssignmentList(courseId){
    const db = getDbReference()
    const collection = db.collection('courses')
    // const studentList = []
    const courses = await collection.find({
        courseId: parseInt(courseId)
    }).toArray()
    console.log("==courses", courses[0])
    if(courses[0]){
        const assignmentList = await getAllAssignments(courses[0].listassignments)
        if(assignmentList){
            return assignmentList
        }else{
            return []
        }        
    }else{
        return null
    }
}

exports.getNumberOfCourses = async function getNumberOfCourses(courseId){
    const db = getDbReference()
    const collection = db.collection('courses')

    const courses = await collection.find({}).toArray()
    return courses.length
}

exports.updateCourseEnrollment = async function updateCourseEnrollment(courseId, toAdd, toRemove){
    const db = getDbReference()
    const collection = db.collection('courses')
    let newEnrollment = []

    const course = await collection.find({
        courseId: parseInt(courseId)
    }).toArray()
    console.log("course", course[0])
    if(course[0]){
        // console.log("course[0]", course[0])
        // console.log("==course[0].liststudent", course[0].liststudent)
        newEnrollment = course[0].liststudent
        // console.log("==newEnrollment", newEnrollment)
        toAdd.forEach(student => {
            // console.log("==student", student)
            // console.log("==newEnrollment.includes(student)", newEnrollment.includes(student))
            if(newEnrollment.includes(parseInt(student), 0) == false){
                newEnrollment.push(parseInt(student))
                // console.log("==newEnrollment after push", newEnrollment)
            }
        })
        toRemove.forEach(student => {
            const index = newEnrollment.indexOf(parseInt(student))
            if(index > -1){
                newEnrollment.splice(index, 1)
            }
        })
        
        const result = await collection.updateOne(
            { courseId: courseId },
            { $set: {
                liststudent: newEnrollment
            }}
        )
        return result.matchedCount > 0
    }else{
        return null
    }
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

