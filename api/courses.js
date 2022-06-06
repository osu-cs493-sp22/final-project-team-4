//
// API sub-router for courses collection endpoints.
//
const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')

const { validateAgainstSchema } = require('../lib/validation')
const { insertNewCourse, getCourseById, CourseSchema, getCoursesPage, deleteCourseById, checkIfCourseExistById } = require('../models/course')


const router = Router()

//
// GET /courses/all - get all courses (without pagination)
//
router.get('/all', async (req, res) => {
    try {
        const db = getDbReference()
        const collection = db.collection('courses')
        const results = await collection.find().toArray()
        res.status(200).send(results)
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Error fetching courses list.  Please try again later."
        })
    }
})

//
// GET /courses - Route to return a paginated list of courses.
//
router.get('/', async (req, res) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const coursesPage = await getCoursesPage(parseInt(req.query.page) || 1)
        coursesPage.links = {}
        if (coursesPage.page < coursesPage.totalPages) {
            coursesPage.links.nextPage = `/courses?page=${coursesPage.page + 1}`
            coursesPage.links.lastPage = `/courses?page=${coursesPage.totalPages}`
        }
        if (coursesPage.page > 1) {
            coursesPage.links.prevPage = `/courses?page=${coursesPage.page - 1}`
            coursesPage.links.firstPage = '/courses?page=1'
        }
        res.status(200).send(coursesPage)
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Error fetching courses list.  Please try again later."
        })
    }
})

/*
 * POST /courses - Route to create a new courses.
 */
router.post('/', async (req, res) => {
    if (validateAgainstSchema(req.body, CourseSchema)) {
        const courseid = parseInt(req.body.courseid);
        if (await checkIfCourseExistById(courseid)) {
            res.status(200).send({
                error: "id: " + req.body.courseid + " already exist. Will not create new one."
            })
            return;
        }
        try {
            const id = await insertNewCourse(req.body)
            res.status(201).send({
                id: id
            })
        } catch (err) {
            console.error(err)
            res.status(500).send({
                error: "Error inserting courses into DB.  Please try again later."
            })
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid courses object."
        })
    }
})

//
// GET /courses/{courseid} - Route to fetch info about a specific course.
//
router.get('/:courseid', async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    try {
        const course = await getCourseById(courseid)
        if (course) {
            res.status(200).send(course)
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch courses.  Please try again later."
        })
    }
})

//
// PUT /courses/{courseid} - Route to update a specific course.
//
router.put('/:courseid', async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    try {
        const course = await getCourseById(courseid)
        if (course) {
            if (deleteCourseById(courseid)) {
                // just deleted a course
                // now add new one
                const id = await insertNewCourse(req.body)
                res.status(200).send({
                    "courseid": courseid,
                    id: id
                });
            } else {
                res.status(500).send({
                    error: "Unable to delete courses."
                })
            }
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch courses.  Please try again later."
        })
    }
})

//
// DEL /courses/{courseid} - Route to delete a specific course.
//
router.delete('/:courseid', async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    try {
        const course = await getCourseById(courseid)
        if (course) {
            if (await deleteCourseById(courseid)) {
                res.status(200).send({ "courseid": courseid });
            } else {
                res.status(500).send({
                    error: "Unable to delete courses."
                })
            }
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch courses.  Please try again later."
        })
    }
})

module.exports = router;
