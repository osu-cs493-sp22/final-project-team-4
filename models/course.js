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
        courseId: courseid
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

