import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";
dotenv.config();

export const register = async (req, res) => {
  const { username, email, password, gender, avatar, fullName } = req.body;
  //Registration Logic Here
  try {
    if (!email || !password || !username || !gender || !fullName) {
      return res
        .status(400)
        .json({ message: "All fields are required." });
    }
    
    const existingUser = await User.findOne({ $or: [{email}, {username}] });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      gender,
      avatar,
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
      signed: true
    });

    const user = await newUser.save();
    res
      .status(201)
      .json({ message: "User registered successfully", user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar }, token });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const checkUsername = async (req, res) => {
    try {
        const { username } = req.body;
        if (!username) return res.status(400).json({ message: "Username required" });

        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(200).json({ available: true, message: "Username available" });
        }

        // Generate suggestions
        const suggestions = [];
        const randomSuffix = () => Math.floor(Math.random() * 1000);
        suggestions.push(`${username}${randomSuffix()}`);
        suggestions.push(`${username}_${randomSuffix()}`);
        suggestions.push(`${username}.${randomSuffix()}`);
        
        res.status(200).json({ 
            available: false, 
            message: "Username taken", 
            suggestions 
        });

    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

export const login = async (req, res) => {
    //Login Logic here
    const {email, password, username} = req.body;
    try{
        if((!email && !username) || !password){
            return res.status(400).json({message: 'Email or Username and Password are required'});
        }
        const user = await User.findOne(email ? {email} : {username});
        if(!user){
            return res.status(404).json({message: 'Invalid Credentials'});
        }
        const isPasswordValid = bcrypt.compareSync(password, user.password);
        if(!isPasswordValid){
            return res.status(401).json({message: 'Invalid Credentials'})
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '1d'});

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: true,
            signed: true
        });

        res.status(200).json({message: 'Login Successful', user, token});

    }
    catch(err){
        res.status(500).json({message: 'Server Error', error: err.message});
    }
};

export const logout = (req, res) =>{
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'Lax',
        secure: true,
        signed: true
    });
    res.status(200).json({message: 'Logout Successful'});
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if(!user){
            return res.status(404).json({message: 'User not found'});
        }
        res.status(200).json({user});
    } catch (err) {
        res.status(500).json({message: 'Server Error', error: err.message});
    }
}