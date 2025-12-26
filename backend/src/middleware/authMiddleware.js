import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) =>{
    const authHeader = req.cookies.token || req.headers.authorization && req.headers.authorization.split(' ')[1];
    if(!authHeader){
        return res.status(401).json({ message: 'Authorization header missing' });
    }
    try{
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(err){
        return res.status(401).json({message: 'Invalid token'});
    }
};

export default authMiddleware;