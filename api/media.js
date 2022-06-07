const { Router } = require('express')
const { ObjectId } = require('mongodb')
const { getPhotoDownloadStream, getPhotoInfoById } = require('../models/submission')
const router = Router()

router.get('/submissions/:filename', async function (req, res, next) {
    const filenameId = req.params.filename.split(".")
    if(filenameId[1] !== 'jpg' && filenameId[1] !== 'jpeg' && filenameId[1] !== 'png'){
        next()
    }
    const submission = await getPhotoInfoById(req.params.filename)
    console.log("==submission:", submission)
    if(submission){
        console.log("==submission.file:", submission.filename)
        getPhotoDownloadStream(submission.filename)
        .on('file', function (file) {   
            res.status(200).type(file.metadata.mimetype)
        })
        .on('error', function (err) {
            if (err.code === 'ENOENT') {
                next()
            } else {
                next(err)
            }
        })
        .pipe(res)
    } 
    else{
        next()
    }
    
})

module.exports = router