const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')

const { validateAgainstSchema } = require('../lib/validation')

const { insertNewAssignment, getAssignmentById, assignmentSchema,patchAssignmentById,deleteAssignmentById, getAssignmentAndSubmissionById, isStudentAndAssignmentInCourse } = require('../models/assignment')
const { submissionSchema, insertNewSubmission, savePhotoFile, getSubmissionsPage, isUserInstructorOfCourse } = require('../models/submission')
const { requireAuthentication, isUserStudent, isUserInstructor } = require('../lib/auth')

const router = Router()

router.post('/', async function (req, res, next) {
    if (validateAgainstSchema(req.body, LodgingSchema)) {
        const id = await insertNewAssignment(req.body)
        res.status(201).send({ id: id })
    } else {
        res.status(400).send({
            err: "The request body was either not present or did not contain a valid Assignment object."
        })
    }
})
router.get('/:courseid', async function (req, res, next)  {
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
    const courseid = parseInt(req.params.courseid);
    if (await isUserAdmin(req.user) || await isUserInstructorOfCourse(req.user, courseid)) {
        try {
            const asssignment = await getAssignmentById(courseid)
            if (asssignment) {
                const result = patchAssignmentById(courseid, req.body)
                if (result) {
                    res.status(200).send();
                } else {
                    res.status(400).send({
                        error: "The request body was either not present or did not contain any fields related to Assignment objects."
                    })
                }
            } else {
                next()
            }
        } catch (err) {
            console.error(err)
            res.status(400).send({
                error: "The request body was either not present or did not contain any fields related to Assignment objects."
            })
        }
    } else {
        res.status(403).send({ err: "request not made by authenticated user" })
    }
})

router.delete('/:courseid', requireAuthentication,async function (req, res, next) {
    const courseid = parseInt(req.params.courseid);
    const asssignment = await getAssignmentById(courseid)
    if(asssignment){
        if(await isUserAdmin(req.user) || await isUserInstructorOfCourse(req.user, courseid)){
            try {
                const asssignment = await getAssignmentById(courseid)
                if (asssignment) {
                    if (await deleteAssignmentById(courseid)) {
                        res.status(204).send();
                    } else {
                        res.status(500).send({
                            error: "Unable to delete asssignment."
                        })
                    }
                } else {
                    next()
                }
            } catch (err) {
                console.error(err)
                res.status(500).send({
                    error: "Unable to delete asssignment. Please try again later."
                })
            } 
        } else {
            res.status(403).send({ err: "request not made by authenticated user" })
        }
    }else{
        next()
    }
})

router.get('/:courseid/submissions', async function (req, res, next)  {

})
router.post('/:courseid/submissions', async function (req, res, next) {

})

module.exports = router