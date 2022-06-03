const { ObjectId } = require("mongodb");

const { getDbReference } = require("../lib/mongo");
const { extractValidFields } = require("../lib/validation");

const submissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: true },
  grade: { required: true },
  file: { required: true },
};

exports.insertNewSubmission = async function insertNewSubmission(submission) {
  const db = getDbReference();
  const collection = db.collection("submissions");

  user = extractValidFields(submission, submissionSchema);
  const result = await collection.insertOne(submission);
  return result.insertedId;
};
