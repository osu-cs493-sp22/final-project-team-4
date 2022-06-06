const { ObjectId, GridFSBucket } = require("mongodb");
const fs = require('fs')

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const submissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true, default: 0.0 },
  file: { required: true },
};

exports.insertNewSubmission = async function insertNewSubmission(submission) {
  const db = getDbReference();
  const collection = db.collection("submissions");

  user = extractValidFields(submission, submissionSchema);
  const result = await collection.insertOne(submission);
  return result.insertedId;
};

exports.savePhotoFile = function (photo) {
  return new Promise(function (resolve, reject) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
    const metadata = {
      assignmentId: photo.assignmentId,
      studentId: photo.studentId,
      timestamp: photo.timestamp,
      grade: null,
      file: photo.file,
      mimetype: photo.mimetype
    }
    const uploadStream = bucket.openUploadStream(photo.file, {
      metadata: metadata
    })
    fs.createReadStream(photo.path).pipe(uploadStream)
      .on('error', function (err) {
        reject(err)
      })
      .on('finish', function (result) {
        console.log("== photo stream result:", result)
        resolve(result._id)
      })
  })
}

exports.getPhotoDownloadStream = function(filename) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  return bucket.openDownloadStreamByName(filename)
}

exports.getPhotoInfoById = async function (id) {
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
};
