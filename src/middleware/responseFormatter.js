function responseFormatter(req, res, next) {
    // Save original send
    const oldSend = res.send;

    res.send = function (data) {
        // If data is already formatted, don't wrap again
        let responseData;
        try {
            responseData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
            responseData = data;
        }

        if (
            responseData &&
            typeof responseData === 'object' &&
            ('success' in responseData)
        ) {
            return oldSend.call(this, data);
        }

        // Default success response
        const formatted = {
            success: true,
            message: 'Request successful',
            data: responseData
        };
        return oldSend.call(this, JSON.stringify(formatted));
    };

    next();
}

module.exports = responseFormatter;