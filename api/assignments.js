const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')
const multer = require('multer')
const crypto = require('crypto')

const fileTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png'
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: function (req, file, callback) {
            const ext = fileTypes[file.mimetype]
            const filename = crypto.pseudoRandomBytes(16).toString('hex')
            callback(null, `${filename}.${ext}`)
        }
    }),
    fileFilter: function (req, file, callback) {
        callback(null, !!fileTypes[file.mimetype])
    }
})

const { validateAgainstSchema } = require('../lib/validation')
const { insertNewAssignment, getAssignmentById, assignmentSchema, getAssignmentAndSubmissionById, isStudentAndAssignmentInCourse, getNumberOfAssignments } = require('../models/assignment')
const { submissionSchema, insertNewSubmission, savePhotoFile, getSubmissionsPage, isUserInstructorOfCourse } = require('../models/submission')
const { requireAuthentication, isUserStudent, isUserInstructor, isUserAdmin } = require('../lib/auth')
const router = Router()

router.post('/', requireAuthentication, async function (req, res, next) {
    if(await isUserAdmin(req.user) || await isUserInstructorOfCourse(req.user, req.body.courseId)){
        const number = await getNumberOfAssignments()
        req.body.assignmentId = parseInt(number)
        if (validateAgainstSchema(req.body, assignmentSchema)) {
            const id = await insertNewAssignment(req.body)
            res.status(201).send({ 
                id: id, 
                assignmentId: number
            })
        } else {
            res.status(400).send({
                err: "The request body was either not present or did not contain a valid Assignment object."
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})
router.get('/:courseid', async function (req, res, next) {
    const courseid = parseInt(req.params.courseid);
    try {
        const asssignment = await getAssignmentById(courseid)
        if (asssignment) {
            res.status(200).send(asssignment)
        } else {
            next()
        }
    } catch (err) {
        console.error(err)
        res.status(404).send({
            error: "Specified Assignment `id` not found."
        })
    }
})
router.patch('/:courseid', async function (req, res, next) {
    const id = req.params.id
    res.status(200).send({})
})

router.delete('/:courseid', async function (req, res, next) {
    const id = req.params.id
    res.status(204).send()
})

router.get('/:courseid/submissions', requireAuthentication, async function (req, res, next) {
    const courseId = parseInt(req.params.courseid)
    if(await isUserInstructor(req.user) && await isUserInstructorOfCourse(req.user, courseId)){
        try {
            /*
             * Fetch page info, generate HATEOAS links for surrounding pages and then
             * send response.
             */
            const submissionPage = await getSubmissionsPage((parseInt(req.query.page) || 1), parseInt(req.query.studentId))
            submissionPage.links = {}
            if (submissionPage.page < submissionPage.totalPages) {
                submissionPage.links.nextPage = `/submissions?page=${submissionPage.page + 1}`
                submissionPage.links.lastPage = `/submissions?page=${submissionPage.totalPages}`
            }
            if (submissionPage.page > 1) {
                submissionPage.links.prevPage = `/submissions?page=${submissionPage.page - 1}`
                submissionPage.links.firstPage = '/submissions?page=1'
            }
            res.status(200).send(submissionPage)
        } catch (err) {
            console.error(err)
            res.status(500).send({
                error: "Error fetching submissions list.  Please try again later."
            })
        }
    }else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
    
})

router.post('/:courseid/submissions', requireAuthentication, upload.single('image'), async function (req, res, next) {
    // console.log("== req.file:", req.file)
    // console.log("== req.body:", req.body)
    const courseId = parseInt(req.params.courseid)
    // console.log(courseId)
    if (isStudentAndAssignmentInCourse(req.body.studentId, req.body.assignmentId, courseId)
        && isUserStudent
        && req.user == req.body.studentId
    ) {
        if (req.file && req.body && req.body.assignmentId && req.body.studentId) {
            const event = new Date()
            const photo = {
                assignmentId: parseInt(req.body.assignmentId),
                studentId: parseInt(req.body.studentId),
                timestamp: event.toISOString(),
                path: req.file.path,
                file: req.file.filename,
                mimetype: req.file.mimetype
            }
            const id = await savePhotoFile(photo)

            const filenameId = req.file.filename.split(".")
            res.status(200).send({
                id: id,
                // downloadPath: `${id}.${filenameId[1]}`
            })
        } else {
            res.status(400).send({
                err: 'Request body needs "file submission", a "assignmentId", and a "studentId"'
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }

})

module.exports = router