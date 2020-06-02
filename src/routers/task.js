const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../models/task')

// Create a new task
router.post('/tasks', auth ,async (req,res)=>{
    const task= new Task({
        ...req.body,
        owner: req.user._id})

    try{
        await task.save()
        res.status(200).send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

// Get all the tasks of the user logged in
router.get('/tasks',auth,async (req,res)=>{

    const match={}
    const sort={}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try{
        await req.user.populate({
            path: 'tasks',
            match , 
            options : {
                limit: parseInt(req.query.limit) ,
                skip: parseInt(req.query.skip) ,
                sort
                }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch(e){
        res.status(500).send()
    }
 /*  try{
        const tasks = await Task.find({owner:req.user._id})
        res.status(200).send(tasks) 
    }catch(e){
        res.status(500).send(e)
    }*/
})

// Get a specific task by its Id & the owner Id
router.get('/tasks/:id',auth,async (req,res)=>{
    const _id = req.params.id

    try{
        const task = await Task.findOne({ _id , owner:req.user._id })
        if(!task){
            return res.status(400).send()
        }
        res.status(200).send(task)
    } catch(e){
        res.status(500).send(e)
    }
})

// Update a task by Id and owner Id
router.patch('/tasks/:id', auth , async (req,res)=>{
    const _id = req.params.id
    const updates = Object.keys(req.body)
    const validupdates = ['description' , 'completed']
    const isvalidoperation = updates.every((update)=> validupdates.includes(update))

    if(!isvalidoperation){
        return res.status(400).send({ error:'Invalid update operation'})
    }

    try{
    const task= await Task.findOne({_id , owner : req.user._id })

     if(!task){
        return res.status(400).send({message:'No task found'})
    }

     updates.forEach((update)=>{
        task[update] = req.body[update] 
     })  
     
     await task.save()
     
     res.status(200).send(task)
    } catch(e){
        return res.status(500).send(e)
    }
})

//Deleting a specific task by Id and owner Id 
router.delete('/tasks/:id', auth , async (req,res)=>{
    const _id = req.params.id

    try{
        const task = await Task.findOneAndDelete({_id , owner:req.user._id})
        if(!task){
            return res.status(400).send({message:'task not found'})
        }
        res.send(task)
    } catch(e){
        res.status(500).send(e)
    }
})

module.exports = router