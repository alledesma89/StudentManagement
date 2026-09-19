const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { findAllStudents, findStudentDetail, findStudentToSetStatus, addOrUpdateStudent, deleteStudentById } = require("./students-repository");
const { findUserById } = require("../../shared/repository");

const checkStudentId = async (id) => {
    const isStudentFound = await findUserById(id);
    if (!isStudentFound) {
        throw new ApiError(404, "Student not found");
    }
}

const getAllStudents = async (payload) => {
    const students = await findAllStudents(payload);
    return students || [];
}

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return student;
}

const sanitizeStudentPayload = (payload) => {
    const sanitized = { ...payload };
    for (const key of Object.keys(sanitized)) {
        if (sanitized[key] === "" || sanitized[key] === undefined) {
            sanitized[key] = null;
        }
    }

    if (sanitized.roll !== null && sanitized.roll !== undefined) {
        const parsedRoll = Number(sanitized.roll);
        if (isNaN(parsedRoll)) {
            sanitized.roll = null;
        } else {
            sanitized.roll = parsedRoll;
        }
    }

    return sanitized;
};

const addNewStudent = async (payload) => {
    const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS = "Student added and verification email sent successfully.";
    const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL = "Student added, but failed to send verification email.";

    const sanitizedPayload = sanitizeStudentPayload(payload);
    const result = await addOrUpdateStudent(sanitizedPayload);
    if (!result || !result.status) {
        throw new ApiError(400, result?.description || result?.message || "Unable to add student");
    }

    try {
        await sendAccountVerificationEmail({ userId: result.userId, userEmail: payload.email });
        return { message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch (error) {
        return { message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL };
    }
}

const updateStudent = async (payload) => {
    const payloadWithUserId = {
        ...payload,
        userId: payload.userId || payload.id
    };
    const sanitizedPayload = sanitizeStudentPayload(payloadWithUserId);
    const result = await addOrUpdateStudent(sanitizedPayload);
    if (!result || !result.status) {
        throw new ApiError(400, result?.description || result?.message || "Unable to update student");
    }

    return { message: result.message || "Student updated successfully" };
}

const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to disable student");
    }

    return { message: "Student status changed successfully" };
}

const deleteStudent = async (id) => {
    await checkStudentId(id);

    const affectedRow = await deleteStudentById(id);
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to delete student");
    }

    return { message: "Student deleted successfully" };
}

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
    deleteStudent,
};
