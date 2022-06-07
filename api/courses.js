//
// API sub-router for courses collection endpoints.
//
const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const { parse } = require('json2csv');

const { validateAgainstSchema } = require('../lib/validation')
const { insertNewCourse, getCourseById, CourseSchema, getCoursesPage, deleteCourseById, checkIfCourseExistById, getStudentRoster, patchCourseById, getNumberOfCourses, getAssignmentList, updateCourseEnrollment } = require('../models/course');
const { requireAuthentication, isUserAdmin } = require('../lib/auth');
const { isUserInstructorOfCourse } = require('../models/submission');


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
router.post('/', requireAuthentication, async (req, res, next) => {
    if (isUserAdmin(req.user)) {
        if (req.body.subject && req.body.number && req.body.title && req.body.term && req.body.instructorId) {
            const courseid = parseInt(req.body.courseId);
            if (await checkIfCourseExistById(courseid)) {
                next()
            } else {
                try {
                    const courseNum = await getNumberOfCourses(courseid)
                    const newBody = {
                        courseId: parseInt(courseNum + 1),
                        subject: req.body.subject,
                        number: req.body.number,
                        title: req.body.title,
                        term: req.body.term,
                        instructorId: req.body.instructorId
                    }
                    const id = await insertNewCourse(newBody)
                    res.status(201).send({
                        id: id,
                        courseId: parseInt(courseNum + 1)
                    })
                } catch (err) {
                    console.error(err)
                    res.status(500).send({
                        error: "Error inserting courses into DB.  Please try again later."
                    })
                }
            }
        } else {
            res.status(400).send({
                error: "Request body is not a valid courses object."
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
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
router.put('/:courseid', requireAuthentication, async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    if (isUserAdmin(req.user) || isUserInstructorOfCourse(req.user, courseid)) {
        try {
            const course = await getCourseById(courseid)
            if (course) {
                const result = patchCourseById(courseid, req.body)
                if (result) {
                    res.status(200).send();
                } else {
                    res.status(500).send({
                        error: "Unable to update course."
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
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }

})

//
// DEL /courses/{courseid} - Route to delete a specific course.
//
router.delete('/:courseid', requireAuthentication, async (req, res, next) => {
    if(isUserAdmin(req.user)){
        const courseid = parseInt(req.params.courseid);
        try {
            const course = await getCourseById(courseid)
            if (course) {
                if (await deleteCourseById(courseid)) {
                    res.status(204).send();
                } else {
                    res.status(500).send({
                        error: "Unable to delete course."
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
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
    
})


router.get('/:courseid/roster', requireAuthentication, async (req, res, next) => {
    const courseId = parseInt(req.params.courseid)
    if(isUserInstructorOfCourse(req.user, courseId)){
        const studentList = await getStudentRoster(parseInt(req.params.courseid))
        console.log("==studentList ", studentList)
        
    
        const fields = ['userId', 'name', 'email'];
        const opts = { fields };
        try {
            const csv = parse(studentList, opts);
            console.log(csv);
            res.status(200).send(csv)
        } catch (err) {
            console.error(err);
            next()
        }
    }else{
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})
//
// GET /courses/{courseid}/students - Fetch a list of the students enrolled in the Course
//
router.get('/:courseid/students', requireAuthentication, async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    if (isUserAdmin(req.user) || isUserInstructorOfCourse(req.user, courseid)) {
        try {
            const studentList = await getStudentRoster(courseid)
            if (studentList) {
                res.status(200).send({
                    "students": studentList
                })
            } else {
                next()
            }
        } catch (err) {
            console.error(err)
            res.status(500).send({
                error: "Unable to fetch a list of the students.  Please try again later."
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})

//
// POST /coursess/{courseid}/students - Update enrollment for a Course
//
router.post('/:courseid/students', requireAuthentication, async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    if (isUserAdmin(req.user) || isUserInstructorOfCourse(req.user, courseid)) {
        try {
            const newEnrollment = await updateCourseEnrollment(courseid, req.body.add, req.body.remove)
            console.log("==newEnrollment", newEnrollment)
            if (newEnrollment) {
                res.status(200).send()
            } else {
                next()
            }
        } catch (err) {
            console.error(err)
            res.status(500).send({
                error: "Unable to fetch courses.  Please try again later."
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})

router.get('/:courseid/roster', requireAuthentication, async (req, res, next) => {
    const courseId = parseInt(req.params.courseid)
    if (isUserAdmin(req.user) || isUserInstructorOfCourse(req.user, courseId)) {
        const studentList = await getStudentRoster(parseInt(req.params.courseid))
        // console.log("==studentList ", studentList)

        if(studentList){
            const fields = ['userId', 'name', 'email'];
            const opts = { fields };
            try {
                const csv = parse(studentList, opts);
                console.log(csv);
                res.status(200).send(csv)
            } catch (err) {
                console.error(err);
                next()
            }
        }else{
            next()
        }
        
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})

//
// GET /courses/{courseid}/assignments - Fetch a list of the Assignments for the Course
//
router.get('/:courseid/assignments', async (req, res, next) => {
    const courseid = parseInt(req.params.courseid);
    try {
        const assignmentList = await getAssignmentList(courseid)
        if (assignmentList) {
            res.status(200).send({
                "assignments": assignmentList
            })
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(500).send({
            error: "Unable to fetch a list of the students.  Please try again later."
        })
    }
})

module.exports = router;
