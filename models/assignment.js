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

exports.bulkInsertNewAssignments = async function bulkInsertNewAssignments(assignments) {
  const assignmentsToInsert = assignments.map(function (assignment) {
    return extractValidFields(assignment, assignmentSchema)
  })
  const db = getDbReference()
  const collection = db.collection('assignments')
  const result = await collection.insertMany(assignmentsToInsert)
  return result.insertedIds
}

exports.getNumberOfAssignments = async function getNumberOfAssignments() {
  const db = getDbReference();
  const collection = db.collection("assignments");

  const assignments = await collection.find({}).toArray()
  return assignments.length
}

exports.insertNewAssignment = async function insertNewAssignment(assignment) {
  const db = getDbReference();
  const collection = db.collection("assignments");
  const courseCollection = db.collection("courses")

  const newAssignment = extractValidFields(assignment, assignmentSchema);
  const result = await collection.insertOne(newAssignment);

  //add assignment to assignment list in course
  const course = await courseCollection.find({ courseId: newAssignment.courseId }).toArray()

  let newList = course[0].listassignments
  newList.push(assignment.assignmentId)
  const update = await courseCollection.updateOne(
    { courseId: newAssignment.courseId },
    {
      $set: {
        listassignments: newList
      }
    }
  )

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

exports.patchAssignmentById = async function patchAssignmentById(assignmentId, body) {
  const db = getDbReference()
  const collection = db.collection('assignments')
  const assignment = await collection.find({
    assignmentId: assignmentId
  }).toArray()
  if (assignment[0]) {
    const result = await collection.updateOne(
      { assignmentId: assignmentId },
      {
        $set: {
          description: body.description,
          title: body.title,
          points: body.points,
          due: body.due
        }
      }
    )
    return result.matchedCount > 0
  }
}

exports.deleteAssignmentById = async function deleteAssignmentById(assignmentId) {
  const db = getDbReference()
  const collection = db.collection('assignments')
  const courseCollection = db.collection("courses")
  const assignments = await collection.find({
    assignmentId: assignmentId
  }).toArray()
  if (assignments[0]) {
    //remove assignment from assignment list in course
    const course = await courseCollection.find({ courseId: assignments[0].courseId }).toArray()

    let newList = course[0].listassignments
    const index = newList.indexOf(parseInt(assignmentId))
    if (index > -1) {
      newList.splice(index, 1)
    }
    const update = await courseCollection.updateOne(
      { courseId: assignments[0].courseId },
      {
        $set: {
          listassignments: newList
        }
      }
    )
    
    //delete assignment
    const result = await collection.deleteOne(
      { assignmentId: assignmentId },
    );
    if (result.deletedCount == 1) {
      return true
    } else {
      return false
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
    {
      $lookup: {
        from: "submissions",
        localField: "_id",
        foreignField: "assignmentId",
        as: "submissions"
      }
    }
  ]).toArray()
  return assignment[0]
}

exports.isStudentAndAssignmentInCourse = async function isStudentAndAssignmentInCourse(studentId, assignmentId, courseId) {
  const db = getDbReference();
  const collection = db.collection("courses");
  const course = await collection.find({
    courseId: parseInt(courseId)
  }).toArray()

  if (course && course[0].liststudent.includes(parseInt(studentId)) && course[0].listassignments.includes(parseInt(assignmentId))) {
    return true
  }
  else {
    return false
  }
}

