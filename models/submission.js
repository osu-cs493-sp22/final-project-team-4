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

exports.getSubmissionsPage = async function getSubmissionsPage(page, assignmentId) {
  const db = getDbReference()
  const collection = db.collection("submissions.files")
  const count = await collection.countDocuments()
  console.log("==count", count)
  console.log("==assignmentId", assignmentId)
  /*
   * Compute last page number and make sure page is within allowed bounds.
   * Compute offset into collection.
   */
  const pageSize = 10
  const lastPage = Math.ceil(count / pageSize)
  page = page > lastPage ? lastPage : page
  page = page < 1 ? 1 : page
  const offset = (page - 1) * pageSize

  const results = await collection.find({
    "metadata.assignmentId": parseInt(assignmentId)
  })
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray()

  return {
    submissions: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count
  }
}

exports.isUserInstructorOfAssignment = async function isUserInstructorOfAssignment(instructorId, assignmentId){
  const db = getDbReference();
  const collection = db.collection("courses");
  
  const course = await collection.find({ instructorId: instructorId }).toArray()

  if(course[0]){
    console.log(course[0].listassignments)
    if(course[0].listassignments.includes(assignmentId)){
      return true
    }
    else{
      return false
    }
  }else{
    return false
  }
}

exports.isStudentInAssignment = async function isStudentInAssignment(userId, assignmentId){
  const db = getDbReference();
  const courseCollection = db.collection("courses");
  const assignmentCollection = db.collection("assignments");

  const assignment = await assignmentCollection.find({ assignmentId: assignmentId }).toArray()
  if(assignment[0]){
    const course = await courseCollection.find({ courseId: assignment[0].courseId }).toArray()
    if(course[0]){
      if (course[0].liststudent.includes(userId)){
        return true
      }else{
        return false
      }
    }else{
      return false
    }
  }else{
    return false
  }
}

exports.insertNewSubmission = async function insertNewSubmission(submission) {
  const db = getDbReference();
  const collection = db.collection("submissions");

  user = extractValidFields(submission, submissionSchema);
  const result = await collection.insertOne(submission);
  return result.insertedId;
};

exports.savePhotoFile = function savePhotoFile(photo) {
  return new Promise(function (resolve, reject) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
    const metadata = {
      assignmentId: parseInt(photo.assignmentId),
      studentId: parseInt(photo.studentId),
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

exports.getPhotoDownloadStream = function getPhotoDownloadStream(filename) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  return bucket.openDownloadStreamByName(filename)
}

exports.getPhotoInfoById = async function getPhotoInfoById(id) {
  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })

  const results = await bucket.find({ "metadata.file": id })
    .toArray();
  return results[0];
};

exports.isUserInstructorOfCourse = async function(instructorId, courseId){
  const db = getDbReference();
  const collection = db.collection('courses')

  const course = await collection.find({
    courseId: parseInt(courseId)
  }).toArray()
  
  if(course[0] && course[0].instructorId == parseInt(instructorId)){
    return true
  }
  else{
    return false
  }
}