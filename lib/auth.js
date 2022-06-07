const { ObjectId } = require('mongodb')

const jwt = require('jsonwebtoken')
const secret = "SuperSecret"

const { getDbReference } = require('../lib/mongo')

function generateAuthToken(userId) {
    const payload = { sub: userId }
    return jwt.sign(payload, secret, { expiresIn: '24h' })
}
exports.generateAuthToken = generateAuthToken


function requireAuthentication(req, res, next) {
    const authHeader = req.get('authorization') || ''
    const authParts = authHeader.split(' ')
    const token = authParts[0] === 'Bearer' ? authParts[1] : null

    try {
        const payload = jwt.verify(token, secret)
        console.log("== payload:", payload)
        req.user = payload.sub
        next()
    } catch (err) {
        res.status(401).send({
            err: "Invalid authentication token"
        })
    }
}
exports.requireAuthentication = requireAuthentication

async function isUserAdmin(id) {
    const db = getDbReference()
    const collection = db.collection('users')

    console.log()
    const user = await collection.find({
        userId: parseInt(id)
    }).toArray()
    // console.log("==admin check user: ", user)
    if (user[0] && user[0].role == 'admin') {
        return true
    }
    else {
        return false
    }
}
exports.isUserAdmin = isUserAdmin

async function isUserInstructor(id) {
    const db = getDbReference()
    const collection = db.collection('users')

    const user = await collection.find({
        userId: parseInt(id)
    }).toArray()
    // console.log("==user", user[0])
    if(user[0] && user[0].role == "instructor"){
        return true
    }else{
        return false
    }
}
exports.isUserInstructor = isUserInstructor

async function isUserStudent(id) {
    const db = getDbReference()
    const collection = db.collection('users')

    const user = await collection.find({
        userId: parseInt(id)
    })
    if(user && user.role == "student"){
        return true
    }else{
        return false
    }
}
exports.isUserStudent = isUserStudent