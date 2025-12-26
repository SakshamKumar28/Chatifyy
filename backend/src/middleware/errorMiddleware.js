const errorMiddleware = (err, req, res, next) => {
    console.log(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        success: false
    });
};

export default errorMiddleware;