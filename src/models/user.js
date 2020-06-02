const mongoose = require('mongoose')
const validator=require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('../models/task')
const sharp = require('sharp')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim:true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        }
    },
    age:{
        type: Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be positive number')
            }
        }
    },
    password:{
        type: String,
        required: true,
        trim: true,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Enter another password')
            }
        }
    },
    tokens:[{
        token: {
            type:String,
            required:true
        }
    }],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
})

userSchema.virtual('tasks',{
    ref:'Task',
    localField: '_id',
    foreignField: 'owner' 
})

userSchema.methods.getPublicProfile= function(){
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.methods.generateAuthToken = async function() {
        const user = this
        const token = jwt.sign({ _id : user._id.toString() } , process.env.JWT_SECRET_URL)
        user.tokens = user.tokens.concat({ token })
        await user.save()
        return token
}

// Checking for credentials when logging in
userSchema.statics.findByCredentials = async (email , password) =>{
    const user = await User.findOne({email})

    if(!user){
        throw new Error('unable to login')
    }

    const isMatch = await bcrypt.compare(password , user.password)

    if(!isMatch){
        throw new Error('Unable to login')
    }

    return user
} 

// Hash the plain text password before saving
userSchema.pre('save',async function(next){
    const user=this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next()
})

// Delete user tasks when the user is removed
userSchema.pre('remove',async function(next){
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})

const User = mongoose.model('User',userSchema)

module.exports = User