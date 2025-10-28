const contactModel = require('../models/contactModel');

/**
 * Handles the submission of the contact form.
 * This is a public endpoint.
 */
exports.submitContactForm = async (req, res, next) => {
    const { name, email, subject, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Name, email, and message are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'A valid email address is required.' });
    }

    try {
        const submission = await contactModel.createSubmission({ name, email, subject, message });
        res.message = 'Your message has been sent successfully!';
        res.status(201).json({
            data: submission
        });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        res.status(500).json({ message: 'Server error during form submission.' });
    }
};

/**
 * Retrieves all contact submissions with pagination.
 * This is a protected admin-only endpoint.
 */
exports.getAllSubmissions = async (req, res, next) => {
    const currentPage = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.limit, 10) || 10;
    const offset = (currentPage - 1) * perPage;
    const search = req.query.search || '';

    try {
        const { submissions, totalItems } = await contactModel.getAllSubmissions({
            limit: perPage,
            offset,
            search,
        });

        const totalPages = Math.ceil(totalItems / perPage);

        res.json({
            data: submissions,
            pagination: {
                currentPage,
                perPage,
                totalItems,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({ message: 'Server error while fetching submissions.' });
    }
};