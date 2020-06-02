const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const User = require('../models/user')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail , cancelemail } = require('../emails/account')

//Creating new user
router.post('/users',async (req,res)=>{
    const user= new User(req.body)

    try{
     await user.save()
     sendWelcomeEmail(user.email,user.name)
     const token = await user.generateAuthToken()
     res.status(200).send({user,token})
    } catch(e) {
     res.status(400).send(e)
    }  
 })

 //Login 
 router.post('/users/login',async (req,res)=>{
     try{
        const user = await User.findByCredentials(req.body.email,req.body.password)
        const token = await user.generateAuthToken()
        res.send({user:user.getPublicProfile() , token})
     }catch(e){
         res.status(400).send(e)
     }
 })
 
 //Logging out one of the session token
 router.post('/users/logout',auth,async (req,res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })

        await req.user.save()

        res.send()
    } catch(e){
        res.status(500).send(e)
    }
 })

 //Logging out all sessions of the user
 router.post('/users/logoutall',auth,async (req,res)=>{
    try{
        req.user.tokens = []

        await req.user.save()

        res.send({message:"Successfully removed all sessions"})
    } catch(e){
        res.status(500).send(e)
    }
 })


 //Reading a profile of user
 router.get('/users/me', auth ,async (req,res)=>{
     res.send(req.user)
 })
  
 //Updating the user logged in
 router.patch('/users/me',auth,async (req,res)=>{
     const updates = Object.keys(req.body)
     const allowedupdates = ['name' , 'password' , 'age' , 'email']
     const isvalidupdate = updates.every((update)=> allowedupdates.includes(update))
 
     if(!isvalidupdate){
         return res.status(400).send({error:'Invalid update'})
     }
 
     try{ 
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })
        
        await req.user.save()

        res.status(200).send(req.user)
     } catch(e){
         res.status(500).send(e)
     }
 })
 
 //Deleting the user logged in
 router.delete('/users/me', auth , async (req,res)=>{
     
     try{
         //const user = await User.findByIdAndDelete(req.user._id)
        await req.user.remove()
        cancelemail(req.user.email , req.user.name)
         res.status(200).send(req.user)
     } catch(e){
         res.status(500).send(e)
     }
 })

 //Endpoint for uploading thru multer

 const upload = multer({

     limits: {
         fileSize: 1000000
     },
     fileFilter(req , file , cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('Please upload a valid image like jpg,jpeg,png'))
        }
        cb(undefined,true)
     }
 })

 // For uploading image of the user 
 router.post('/users/me/avatar',auth,upload.single('avatars'),async (req,res)=>{
    const buffer = await sharp(req.file.buffer).resize({ width: 250 , height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()  
    res.send()
 },(error,req,res,next)=>{
     res.status(400).send({error : error.message})
 })

 // For deleting the image of the user in this case it is avatar
 router.delete('/users/me/avatar', auth , async (req,res) =>{
     req.user.avatar = undefined
     await req.user.save()
     res.send()
 })

 //Getting users image 
router.get('/users/:id/avatar', async (req,res)=>{
    
    try{
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error()
    }

    res.set('Content-Type', 'image/png')
    res.send(user.avatar)
    
    } catch(e){
        res.status(404).send()
    }
})
 

module.exports = router