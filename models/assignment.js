const { ObjectId } = require("mongodb");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const assignmentSchema = {
  assignmentId: { required: true },
  description: { required: true },
  courseId: { requires: true },
  title: { require: true },
  points: { require: true },
  due: { require: true }, //ISO 8601 form date and time
};
exports.assignmentSchema = assignmentSchema;

exports.bulkInsertNewAssignments = async function bulkInsertNewAssignments(assignments){
  const assignmentsToInsert = assignments.map(function (assignment) {
    return extractValidFields(assignment, assignmentSchema)
  })
  const db = getDbReference()
  const collection = db.collection('assignments')
  const result = await collection.insertMany(assignmentsToInsert)
  return result.insertedIds
}

exports.getNumberOfAssignments = async function getNumberOfAssignments(){
  const db = getDbReference();
  const collection = db.collection("assignments");

  const assignments = await collection.find({}).toArray()
  return assignments.length
}

exports.insertNewAssignment = async function insertNewAssignment(assignment) {
  const db = getDbReference();
  const collection = db.collection("assignments");

  user = extractValidFields(assignment, assignmentSchema);
  const result = await collection.insertOne(assignment);
  return result.insertedId;
};

exports.getAssignmentById = async function getAssignmentById(id) {
  const db = getDbReference();
    const collection = db.collection("assignments");
    const assignment = await collection.find({ assignmentId: id }).toArray()
    if (assignment[0]) {
        return assignment[0]
    } else {
        return undefined
    }
};

exports.patchAssignmentById = async function patchAssignmentById(courseId, body){
  const db = getDbReference()
  const collection = db.collection('assignments')
  const assignment = await collection.find({
      courseId: courseId
  }).toArray()
  if(assignment[0]){
      const result = await collection.updateOne(
          { courseId: courseId },
          { $set: {
              assignmentId: body.assignmentId,
              description: body.description,
              title: body.title,
              points: body.points,
              due: body.due
          }}
      )
      return result.matchedCount > 0
  }
}

exports.deleteAssignmentById = async function deleteAssignmentById(courseid) {
  const db = getDbReference()
  const collection = db.collection('assignments')
  const assignments = await collection.find({
      courseId: courseid
  }).toArray()
  if (assignments[0]) { 
      const result = await collection.deleteOne(
          { courseId: courseid },
      );
      if (result.deletedCount == 1) {
          return true
      } else {
          return true
      }
  } else {
      return false
  }
}

exports.getAssignmentAndSubmissionById = async function getAssignmentAndSubmissionById(id) {
    const db = getDbReference();
    const collection = db.collection("assignments");
    const assignment = await collection.aggregate([
        { $match: { _id: new ObjectId(id) } },
        { $lookup: {
            from: "submissions",
            localField: "_id",
            foreignField: "assignmentId",
            as: "submissions"
        }}
    ]).toArray()
    return assignment[0]
}

exports.isStudentAndAssignmentInCourse = async function isStudentAndAssignmentInCourse(studentId, assignmentId, courseId){
  const db = getDbReference();
  const collection = db.collection("courses");
  // console.log(courseId)
  // console.log(studentId)
  // console.log(assignmentId)
  const course = await collection.find({
    courseId: parseInt(courseId)
  }).toArray()
  // console.log("==course", course[0])

  if(course && course[0].liststudent.includes(parseInt(studentId)) && course[0].listassignments.includes(parseInt(assignmentId))){
    return true
  }
  else{
    return false
  }
}

