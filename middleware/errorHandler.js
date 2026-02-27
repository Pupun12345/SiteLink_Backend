const errorHandler = ( err, req, res, next)=> {
     let error = {...err};
     error.message = err.message;

     console.error('Error:',err);

     if(err.name === 'CastError'){
        const message = ' Resource not found';
        return res.status(404).json({
            success:false,
            message:message,
            error: message,
        });
     }

     if(err.code === 11000){
        const field = Object.keys(err.keyPattern)[0];
        const message = `This ${field} is already registered`
        return res.status(400).json({
            success:true,
            message:message,
            error: message,
        });
     }

     if(err.name === 'ValidationError'){
        const message = Object.values(err.errors).map(val=>val.message).join(',');
        return res.status(400).json ({
            success: false,
            message: "Validation Failed",
            error:message,
        });
     }

     res.status(error.statusCode||500).json({
        success:false,
        message: error.message|| 'Server Error',
        error: error.message||'Server Error',
     })
    };
module.exports = errorHandler;