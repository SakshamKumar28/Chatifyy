import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type : String,
        required: true,
        unique: true
    },
    gender:{
        type: String,
        required:true,
        enum:["male", "female", "other"]
    },
    password: {
        type: String,
        required: true
    },
    avatar:{
        type:String,
        default: function() {
            if(this.gender === "male") return "https://png.pngtree.com/png-clipart/20200224/original/pngtree-cartoon-color-simple-male-avatar-png-image_5230557.jpg";
            if(this.gender === "female") return "https://www.svgrepo.com/show/382097/female-avatar-girl-face-woman-user-9.svg";
            return "https://cdn-icons-png.flaticon.com/512/149/149288.png";
        }
    },
}, {timestamps: true});

const User = mongoose.model('User', userSchema);


export default User;