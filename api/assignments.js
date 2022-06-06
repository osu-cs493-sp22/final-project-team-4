const { Router } = require('express')
const { getDbReference } = require('../lib/mongo')

const { validateAgainstSchema } = require('../lib/validation')
const { insertNewAssignment, getAssignmentById, assignmentSchema, getAssignmentAndSubmissionById } = require('../models/assignment')
const{submissionSchema,insertNewSubmission} = require('../models/submission')
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
    const id = req.params.id
    res.status(200).send({})
})

router.delete('/:courseid', async function (req, res, next) {
    const id = req.params.id
    res.status(204).send()
})

router.get('/:courseid/submissions', async function (req, res, next)  {

})
router.post('/:courseid/submissions', async function (req, res, next) {

})

module.exports = router