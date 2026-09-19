const { z } = require("zod");
const asyncHandler = require("express-async-handler");
const { ApiError } = require("../../utils");
const {
    getAllStudents,
    addNewStudent,
    getStudentDetail,
    setStudentStatus,
    updateStudent,
    deleteStudent,
} = require("./students-service");

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const idParamSchema = z.object({
    id: z.coerce
        .number({ invalid_type_error: "Student ID must be a valid number" })
        .int({ message: "Student ID must be an integer" })
        .positive({ message: "Student ID must be a positive integer" })
});

const getStudentsQuerySchema = z.object({
    page: z.coerce.number().int().min(1, "Page must be at least 1").default(1),
    limit: z.coerce.number().int().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100").default(10),
    name: z.string().trim().optional(),
    className: z.string().trim().optional(),
    section: z.string().trim().optional(),
    roll: z.string().trim().optional(),
});

const addStudentSchema = z.object({
    name: z.string({ required_error: "Student name is required" }).trim().min(1, "Name is required"),
    email: z.string({ required_error: "Email is required" }).trim().email("Invalid email address format"),
    class: z.string().trim().optional().or(z.literal("")).nullable(),
    section: z.string().trim().optional().or(z.literal("")).nullable(),
    roll: z.union([z.string(), z.number()]).optional().nullable(),
    phone: z.string().trim().optional().or(z.literal("")).nullable(),
    gender: z.string().trim().optional().or(z.literal("")).nullable(),
    dob: z.any().optional().nullable(),
    fatherName: z.string().trim().optional().or(z.literal("")).nullable(),
    fatherPhone: z.string().trim().optional().or(z.literal("")).nullable(),
    motherName: z.string().trim().optional().or(z.literal("")).nullable(),
    motherPhone: z.string().trim().optional().or(z.literal("")).nullable(),
    guardianName: z.string().trim().optional().or(z.literal("")).nullable(),
    guardianPhone: z.string().trim().optional().or(z.literal("")).nullable(),
    relationOfGuardian: z.string().trim().optional().or(z.literal("")).nullable(),
    currentAddress: z.string().trim().optional().or(z.literal("")).nullable(),
    permanentAddress: z.string().trim().optional().or(z.literal("")).nullable(),
    admissionDate: z.any().optional().nullable(),
    systemAccess: z.boolean().optional().nullable(),
}).passthrough();

const updateStudentSchema = addStudentSchema.partial().passthrough();

const studentStatusSchema = z.object({
    status: z.boolean({ required_error: "Status field is required and must be a boolean (true or false)" }),
});

// ==========================================
// ERROR HANDLING HELPER
// ==========================================

/**
 * Handles Zod validation errors and PostgreSQL constraint error codes,
 * mapping them into proper ApiError HTTP status codes.
 */
const handleControllerError = (error) => {
    if (error instanceof z.ZodError) {
        const fieldErrors = error.issues.map((issue) => `${issue.path.join(".") || "field"}: ${issue.message}`).join("; ");
        throw new ApiError(400, `Validation Error: ${fieldErrors}`);
    }

    // PostgreSQL Error Codes mapping
    if (error.code === "23505") {
        throw new ApiError(400, "Conflict: A student with this email or roll number already exists.");
    }
    if (error.code === "23503") {
        throw new ApiError(400, "Bad Request: Referenced entity (class, section, or reporter) does not exist.");
    }
    if (error.code === "22P02") {
        throw new ApiError(400, "Bad Request: Invalid parameter or input syntax.");
    }

    if (error instanceof ApiError) {
        throw error;
    }

    throw new ApiError(500, error.message || "Internal server error");
};

const parseStudentId = (idParam, reqUser) => {
    if (idParam === "me") {
        return reqUser?.id;
    }
    const parsedId = Number(idParam);
    if (isNaN(parsedId) || parsedId <= 0) {
        throw new ApiError(400, "Invalid student ID format. ID must be a positive integer.");
    }
    return parsedId;
};

// ==========================================
// CONTROLLER HANDLERS (CRUD)
// ==========================================

/**
 * GET /api/v1/students
 * List all students with pagination & filtering.
 * Returns: HTTP 200 OK
 */
const handleGetAllStudents = asyncHandler(async (req, res) => {
    try {
        const validatedQuery = getStudentsQuerySchema.parse(req.query);
        const students = await getAllStudents(validatedQuery);
        res.status(200).json({ students });
    } catch (error) {
        handleControllerError(error);
    }
});

/**
 * GET /api/v1/students/:id
 * Get detailed profile for a student by ID.
 * Returns: HTTP 200 OK | HTTP 404 Not Found
 */
const handleGetStudentDetail = asyncHandler(async (req, res) => {
    try {
        const id = parseStudentId(req.params.id, req.user);
        const student = await getStudentDetail(id);
        res.status(200).json(student);
    } catch (error) {
        handleControllerError(error);
    }
});

/**
 * POST /api/v1/students
 * Add a new student.
 * Returns: HTTP 201 Created | HTTP 400 Bad Request
 */
const handleAddStudent = asyncHandler(async (req, res) => {
    try {
        const validatedPayload = addStudentSchema.parse(req.body);
        const result = await addNewStudent(validatedPayload);
        res.status(201).json({
            success: true,
            message: result.message || "Student created successfully",
            data: result
        });
    } catch (error) {
        handleControllerError(error);
    }
});

/**
 * PUT /api/v1/students/:id
 * Update an existing student by ID.
 * Returns: HTTP 200 OK | HTTP 400 Bad Request | HTTP 404 Not Found
 */
const handleUpdateStudent = asyncHandler(async (req, res) => {
    try {
        const id = parseStudentId(req.params.id, req.user);
        const validatedPayload = updateStudentSchema.parse(req.body);
        const result = await updateStudent({ ...validatedPayload, id, userId: id });
        res.status(200).json({
            success: true,
            message: result.message || "Student updated successfully",
            data: result
        });
    } catch (error) {
        handleControllerError(error);
    }
});

/**
 * POST /api/v1/students/:id/status
 * Update student active status (enable/disable system access).
 * Returns: HTTP 200 OK | HTTP 400 Bad Request | HTTP 404 Not Found
 */
const handleStudentStatus = asyncHandler(async (req, res) => {
    try {
        const userId = parseStudentId(req.params.id, req.user);
        const { status } = studentStatusSchema.parse(req.body);
        const reviewerId = req.user?.id || null;
        const result = await setStudentStatus({ userId, reviewerId, status });
        res.status(200).json({
            success: true,
            message: result.message || "Student status updated successfully"
        });
    } catch (error) {
        handleControllerError(error);
    }
});

/**
 * DELETE /api/v1/students/:id
 * Delete a student by ID.
 * Returns: HTTP 200 OK | HTTP 404 Not Found
 */
const handleDeleteStudent = asyncHandler(async (req, res) => {
    try {
        const id = parseStudentId(req.params.id, req.user);
        const result = await deleteStudent(id);
        res.status(200).json({
            success: true,
            message: result.message || "Student deleted successfully"
        });
    } catch (error) {
        handleControllerError(error);
    }
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
    handleDeleteStudent,
};
