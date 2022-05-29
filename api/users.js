const { Router } = require('express')
const { requireAuthentication } = require('../lib/auth')
const router = Router()

// const bcrypt = require('bcryptjs')
// const jwt = require('jsonwebtoken')
// const secret = "SuperSecret"

const { validateAgainstSchema } = require('../lib/validation')

//only admin can create 'admin' or 'instructor'
router.post('/', requireAuthentication, async (req,res, next) => {
    res.status(201).send()
    //400 if req.body not present or didnt contain valid user object
    //403 if request not made by authenticated user
})

//login a user with their email and password
router.post('/login', async (req,res, next) => {
    res.status(201).send()
    //400 if req.body not present or didnt contain valid user object
    //401 if credentials invalid
    //500 internal server error
    
})

//get info about a particular user, must be logged in as user to see specific user, admin can view anyone
//if id is an instructor, show list of all the course id's they teach
//if id is a user, show list of all the course id's they take
router.get('/:id', async (req,res, next) => {
    res.status(200).send()
    //403 if request not made by authenticated user
    //400 (next()) if user id not found
})
