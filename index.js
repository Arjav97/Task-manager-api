const express=require('express')
require('./src/db/mongoose')
const bcrypt = require('bcryptjs')

const userRouter = require('./src/routers/user')
const taskRouter = require('./src/routers/task')

const app=express()
const port = process.env.PORT

const multer = require('multer')
const upload = multer({
    dest : 'images'
})
app.post('/upload',upload.single('upload'),(req,res)=>{
    res.send()
})

app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

const Task=require('./src/models/task')
const User=require('./src/models/user')

//Running a server on port 
app.listen(port , ()=>{
    console.log('Server is up on port '+port)
})

