const pool = require('../config/db');

const submissionFields = 'id, name, email, subject, message, status, created_at, updated_at';

/**
 * Creates a new contact submission.
 * @param {object} submissionDetails - The details of the submission.
 * @param {string} submissionDetails.name - The sender's name.
 * @param {string} submissionDetails.email - The sender's email.
 * @param {string} [submissionDetails.subject] - The message subject.
 * @param {string} submissionDetails.message - The message content.
 * @returns {Promise<object>} The created submission.
 */
async function createSubmission({ name, email, subject, message }) {
    const result = await pool.query(
        `INSERT INTO contact_submissions (name, email, subject, message)
         VALUES ($1, $2, $3, $4)
         RETURNING ${submissionFields}`,
        [name, email, subject || null, message]
    );
    return result.rows[0];
}

/**
 * Retrieves all contact submissions with pagination.
 * @param {object} options - Pagination options.
 * @param {number} options.limit - The number of items per page.
 * @param {number} options.offset - The starting offset.
 * @returns {Promise<object>} An object containing submissions and total count.
 */
async function getAllSubmissions({ limit, offset, search }) {
    const queryParams = [];
    let whereClause = '';
    let paramIndex = 1;

    if (search) {
        whereClause = `WHERE name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR subject ILIKE $${paramIndex}`;
        queryParams.push(`%${search}%`);
        paramIndex++;
    }

    const submissionsQuery = `
        SELECT ${submissionFields} FROM contact_submissions
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;

    const countQuery = `SELECT COUNT(*) FROM contact_submissions ${whereClause}`;

    const submissionsResult = await pool.query(
        submissionsQuery,
        [...queryParams, limit, offset]
    );

    const countResult = await pool.query(countQuery, queryParams);

    return {
        submissions: submissionsResult.rows,
        totalItems: parseInt(countResult.rows[0].count, 10),
    };
}


module.exports = {
    createSubmission,
    getAllSubmissions,
};