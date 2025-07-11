// responseFormatter.js
function responseFormatter(req, res, next) {
    const oldSend = res.send;

    res.send = function (data) {
        let responseData;
        try {
            responseData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
            responseData = data; // Keep as is if not parsable JSON
        }

        // Only format if it's likely a successful response and not already formatted
        if (
            res.statusCode >= 200 && res.statusCode < 300 && // Check for success status codes
            !(responseData && typeof responseData === 'object' && 'success' in responseData)
        ) {
            const formatted = {
                success: true,
                message: res.message || 'Request was successful',
                data: responseData,
            };
            return oldSend.call(this, JSON.stringify(formatted));
        }
        // For errors or already formatted data, send as is
        return oldSend.call(this, data);
    };
    next();
}
module.exports = responseFormatter;
