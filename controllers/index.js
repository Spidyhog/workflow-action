const express = require("express");
const Level = require("../models/level");
const Workflow = require("../models/workflow");

//Route for creating the level which consist of type of level(simple-sequential, rr-round_robin, one-anyone).
exports.postData = async (req, res, next) => {
  const transaction = req.body.transaction;   //get the transaction for which the level is to be defined
  const lev = req.body.level;
  const level = new Level({
    transaction: transaction,
    level: lev,
  });
  
  const isUninque = await isEverythingUnique(lev, 'id');    //checking if the level id is unique in the array
  if(isUninque)     //if level id's are unique, function wil return true
  {
    level
    .save()         // saving the level
    .then((s1) => {
      console.log(s1);
      res.status(201).json({
        success: "true",
        data: s1,
      });
    })
    .catch((e1) => {
      console.error(e1);
      res.status(500).json({
        success: "false",
      });
    });
  } else {                        //if duplicate transaction is found
    return res.status(400).json({
      success: 'false',
      message: 'duplicates id found'
    })
  }
  
};


//route to get all levels
exports.getLevel = async (req, res, next) => {
  try{
    const level = await Level.find({});   //fetching the documents
    return res.status(200).json({
      success: 'true',
      message: 'data found',
      data: level
    })
  } catch(e1) {
    return res.status(500).json({
      success: 'false',
      message: 'some error occurred'
    })
  }
};


//get level details by ID
exports.getLevelById = async (req, res, next) => {
  const {id} = req.params
  console.log(id);
  try{
    const level = await Level.findById(id);     //finding particular level document
    return res.status(200).json({
      success: 'true',
      message: 'data found',
      data: level
    })
  } catch(e1) {
    return res.status(500).json({
      success: 'false',
      message: 'some error occurred'
    })
  }
};


//create workflow by admin
exports.postWorkflow = async (req, res, next) => {
  const level_id = req.body.level_id;     //level_id is the object_id of the level transaction object
  const levels = req.body.levels;
  const workflow = new Workflow({
    level_id: level_id,
    levels: levels,
  });
  try {
    const data1 = await Level.findById(level_id);   //finding the level transaction document through level_id
    //console.log(data1.level.length);
    //console.log(levels.length);

    //comparing the length of the arrays: level from Level-transaction document and levels from the workflow
    if (data1.level.length === levels.length) {
      const data = await workflow.save();     //if length matches, then saving, else rejecting
      res.status(201).json({
        success: "true",
        data: data,
      });
    } else {
      res.status(400).json({
        success: "false",
        message: "mismatched level number",       //rejecting when the number of level mismatches in both the document
      });
    }
  } catch (e) {
    console.log(e1);
    res.status(500).json({
      success: "false",
    });
  }
};


//get all documents of workflow schema
exports.getWorkflow = async (req, res, next) => {
  try {
    const data = await Workflow.find({});   //fetching the documents
    console.log(data);
    //console.log(level[0])
    res.status(200).json({
      success: 'true',
      message: 'data found',
      data: data
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ e });
  }
};


//get a particular workflow, by id along with the level schema object
exports.getWorkflowById = async (req, res, next) => {
  const {id} = req.params
  try {
    const data = await Workflow.findById(id).populate('level_id');    //fetching documents
    console.log(data);
    //console.log(level[0])
    res.status(200).json({
      success: 'true',
      message: 'data found',
      data: data
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ e });
  }
};

//testing function  - ignore
exports.updateWork = (req, res, next) => {
 
    return res.status(200).json({
      success:'true',
      message: 'api working'
    })
}

//updating the workflow by the users
exports.updateWorkflow = async (req, res, next) => {
  const { level, userName, status, transaction, _id } = req.body; //storing details from the user
  try{
    let data = await Workflow.findById(_id)
    let st = data.level_id

    const levelType = await getLevelType(level, st);  //getting the level type from the function (simple-sequential, rr-round_robin, one-anyone)
    console.log('this is status', levelType);   //levelType contains 'simple','rr' or 'one'
    
    let dta = null
    dta = data.levels.find(l => l.level === level)?true:false;  //checking if the number of levels are same in both documents
    
    if(dta && (levelType != null && levelType != 'error'))
    {
      let i = 1;
      const len = data.levels.length;
      for(i=0;i<len;i++)
      {
        //console.log(data.levels[i].status);
        if(data.levels[i].level === level)    //if the level number matches for the both document, then execute this
        {
          //console.log(data.levels[i].users);
          const upda = await updateStatus(data.levels[i], userName, levelType, status);   //updating the status of the particular user
          if(upda != ('wait' || 'terminate'))
          {
            
            data.levels[i]=upda;
            console.log(data.levels[i]);
            
            //updating the document
            await Workflow.findByIdAndUpdate(_id, data, function (err, up) {
              if(err) console.log(err);
              else console.log(up.levels);
            })
            return res.status(200).json({
              success: 'true',
              message: 'data updated successfully',
              data: data
            })
           
            //console.log('hello',data.levels[i]);
          } else if(upda == 'wait') {     //if previous levels are not approved, then wait
            return res.status(403).json({
              success: 'false',
              message: 'Initial levels are not approved'
            })
          } else if(upda == 'terminate') {    //if a previous level is terminated, then terminate this request
            return res.status(403).json({
              success: 'false',
              message: 'Someone terminated request at initial levels'
            })
          }
          break;    //break after finding the particular level
        } else {    //else will if the index number to be found is not at the 0th index. This means, it will execute before we find the level id
          if(data.levels[i].status === 'active')   //if the previous level is active then continue
            continue;
          else if(data.levels[i].status === 'terminate') {    //if the previous level is terminated, the terminate the current request
            return res.status(403).json({
              success: 'false',
              message: 'initial level terminated'
            })
          }
          else {
            return res.status(400).json({         //if the previous level is neither active nor terminated, execute this.
              success: 'false',
              message: 'Previous levels are not active'
            })
          }
        }
      }
    } else {
      console.log('level not found');   //if level number is mismatched
      res.status(400).json({
        success: 'false',
        message: 'level not found'
      })
    }
    
    
  } catch(e) {
      console.error(e);
      res.status(400).json({          //bad request
          success: 'false',
          message: 'something bad happened'
      })
  }
};


//function to get levelType: simple, rr, one
getLevelType = async (level, id) => {
  //console.log(level, st);
  try{

    const data1 = await Level.findById(id);
    console.log(data1.level);
    let len = data1.level.length;
    let i = 0
    for (i=0; i< len; i++)
    {
      if(data1.level[i].id === level)
        return data1.level[i].name
      // console.log(data1.level[i].id);
    }
    return null;
  } catch(e1) {
    return 'error'
  }
}


//function to update the status of transaction by the user
updateStatus = async (data, username, levelType, status) => {
  console.log('in update Status');
  if(data.status == '')
  {
    if(levelType === 'simple')    //if the level is sequentianl (simple)
    {
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name != username)    //checking for the previous user status: active, reject, terminate
        {
          if(data.users[i].status == '') {
            return 'wait'
          } else if(data.users[i].status == 'approve') {
            continue;
          } else if(data.users[i].status == 'reject') {
            return 'terminate'
          } else if(data.users[i].status == 'terminate') {
            continue;
          }
        } else {                //checking and updating the user status in the current level
          if(status === 'approve') {
            data.users[i].status='approve'
            data.status = ''
          } else if(status == 'reject') {
            data.users[i].status='reject'
            data.status = 'terminate'
          } else if(status == 'remove') {
            data.users[i].status='reject and remove from workflow'
            data.status = ''
          }
          
        }
      }
      if(data.status != 'terminate')
      {
        if((data.users[len-1].status == 'approve') || (data.users[len-1].status == 'remove'))
        {
          data.status='active'
        }
      }
      return data;
    } else if(levelType == 'rr') {    //if the level is round-robin (rr)
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name == username)
        {
          if(status == 'approve')     //if status of current user is approve
          {
            data.users[i].status='approve'
          } else if(status == 'remove') {     //if status of current user is remove, then its active
            data.users[i].status=''
          } else if(status == 'reject') {   //if status of current user is reject, then mark status terminated
            data.users[i].status = 'reject'
            data.status = 'terminate'
          }
          break;
        }
      }
      let flag = 1
      //checking status of all users
      for(i=0;i<len;i++)
      {
        if(data.users[i].status == '')
        {
          flag++;
        } else {
          break;
        }
      }
      if(flag == len)     //if the status of all user is active, then mark it active
      {
        data.status='active'
      }
      return data;
    } else if(levelType == 'one') {   //if the level is anyone - (one)
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name == username)
        {
          if(status == 'approve' && data.status != 'terminate')   //if current user action is approve and the level status is '', then mark it active
          {
            data.users[i].status='approve'
            data.status='active'
          } else if(status == 'remove' && data.status != 'terminate') {   //if current user action is remove and the level status is '', then mark it active
            data.users[i].status=''
            data.status='active'
          } else if(status == 'reject' && data.status != 'active') {      //if current user action is reject and the level status is '', then mark it terminate
            data.users[i].status = 'reject'
            data.status = 'terminate'
          }
          return data;
          
        }
      }
    }

  } else if(data.status === 'terminate') {    //if the level status is already terminated
    return 'terminate'
  }

  console.log(data);
  return 'hello'
}


//checking for unique id in the array
isEverythingUnique = (arr, key) => {   
  const uniques = new Set(arr.map(item => item[key]));
  return [...uniques].length === arr.length; 
}