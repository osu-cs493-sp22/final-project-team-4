const { Router } = require('express')
const { requireAuthentication, isUserAdmin, generateAuthToken } = require('../lib/auth')
const router = Router()

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const secret = "SuperSecret"


const { validateAgainstSchema } = require('../lib/validation')
const { insertNewUser, UserSchema, getUserById, getUserByEmail } = require('../models/user')
const { ObjectId } = require('mongodb')


//only admin can create 'admin' or 'instructor'
//201 success    
//400 if req.body not present or didnt contain valid user object
//403 if request not made by authenticated user
router.post('/', async (req, res, next) => {
    if (validateAgainstSchema(req.body, UserSchema)) {
        if (req.body.role == 'admin' || req.body.role == 'instructor') { //make sure admin is logged in to add admin or instructor
            let loggedInUser = 0
            let errorStatus = 0
            const authHeader = req.get('authorization') || ''
            const authParts = authHeader.split(' ')
            const token = authParts[0] === 'Bearer' ? authParts[1] : null

            try {
                const payload = jwt.verify(token, secret)
                console.log("== payload:", payload)
                loggedInUser = payload.sub
            } catch (err) {
                errorStatus = 1
            }
            console.log("== loggedInUser", loggedInUser)
            console.log("== errorStatus", errorStatus)
            if (loggedInUser !== 0 && errorStatus === 0) {
                const adminCheck = await isUserAdmin(loggedInUser)
                if (adminCheck === false) {
                    res.status(403).send({ err: "request not made by authenticated user" })
                }
                else {
                    req.body.password = await bcrypt.hash(req.body.password, 8)
                    console.log("== Hashed, salted password:", req.body.password)

                    const user = await insertNewUser(req.body)
                    res.status(201).send({ id: req.body.userId })
                }
            } else {
                res.status(403).send({ err: "request not made by authenticated user" })
            }
        }

        else { //user adding a student
            req.body.password = await bcrypt.hash(req.body.password, 8)
            console.log("== Hashed, salted password:", req.body.password)

            const user = await insertNewUser(req.body)
            res.status(201).send({ id: req.body.userId })
        }
    } else {
        res.status(400).send({ err: "body is not a valid user object" })
    }
})

//login a user with their email and password
//201 success
//400 if req.body not present or didnt contain valid user object
//401 if credentials invalid
//500 internal server error
router.post('/login', async (req, res, next) => {
    if (req.body && req.body.email && req.body.password) { //if logged in with email and password
        const user = await getUserByEmail(req.body.email)
        const authenticated = user && await bcrypt.compare(
            req.body.password,
            user.password
        )

        if (authenticated) {
            const token = generateAuthToken(user.userId)
            res.status(200).send({ token: token })
        }
        else {
            res.status(401).send({
                error: "Invalid credentials"
            })
        }
    }
    else {
        res.status(400).send({
            err: "body is not a valid user object"
        })
    }

})

//get info about a particular user, must be logged in as user to see specific user, admin can view anyone
//if id is an instructor, show list of all the course id's they teach
//if id is a user, show list of all the course id's they take
//200 success
//403 if request not made by authenticated user
//404 (next()) if user id not found
router.get('/:id', requireAuthentication, async (req, res, next) => {
    const id = parseInt(req.params.id)
    const adminCheck = await isUserAdmin(req.user)
    console.log(req.user == id)
    console.log(adminCheck)
    if (req.user == id || adminCheck) {
        const user = await getUserById(id)
        if (user) {
            res.status(200).send(user)
        }
        else {
            next()
        }

    } else {
        res.status(403).send({
            err: "request not made by authenticated user"
        })
    }
})


module.exports = router
