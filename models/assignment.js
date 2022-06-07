const { ObjectId } = require("mongodb");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const assignmentSchema = {
  courseId: { requires: true },
  title: { require: true },
  points: { require: true },
  due: { require: true }, //ISO 8601 form date and time
};
exports.assignmentSchema = assignmentSchema;

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
      return assignment
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

