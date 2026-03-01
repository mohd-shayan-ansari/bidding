export function errorHandler(error, _req, res, _next) {
    console.error(error)
    return res.status(error.statusCode || 500).json({
        message: error.message || 'Internal server error',
    })
}