import jwt from 'jsonwebtoken';

export const generateToken=(userId)=>{
    const jwtsecerate=process.env.JWT_SECRET;
    return jwt.sign({userId}, jwtsecerate, {expiresIn:"24h"})
}

export const verifyToken =(token)=>{
    const jwtsecerate=process.env.JWT_SECRET;
    try {
        const playload = jwt.verify(token, jwtsecerate) 
        return playload;
    } catch (error) {
        console.log("Token validation error:", error.message);
        return null;
    }
}

