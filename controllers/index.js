const express = require("express");
const Level = require("../models/level");
const Workflow = require("../models/workflow");

exports.postData = async (req, res, next) => {
  const transaction = req.body.transaction;
  const lev = req.body.level;
  const level = new Level({
    transaction: transaction,
    level: lev,
  });
  
  const isUninque = await isEverythingUnique(lev, 'id');
  if(isUninque)
  {
    level
    .save()
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
  } else {
    return res.status(400).json({
      success: 'false',
      message: 'duplicates id found'
    })
  }
  
};

exports.getLevel = async (req, res, next) => {
  try{
    const level = await Level.find({});
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

exports.getLevelById = async (req, res, next) => {
  const {id} = req.params
  console.log(id);
  try{
    const level = await Level.findById(id);
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

exports.postWorkflow = async (req, res, next) => {
  const level_id = req.body.level_id;
  const levels = req.body.levels;
  const workflow = new Workflow({
    level_id: level_id,
    levels: levels,
  });
  try {
    const data1 = await Level.findById(level_id);
    //console.log(data1.level.length);
    //console.log(levels.length);
    if (data1.level.length === levels.length) {
      const data = await workflow.save();
      res.status(201).json({
        success: "true",
        data: data,
      });
    } else {
      res.status(400).json({
        success: "false",
        message: "mismatched level number",
      });
    }
  } catch (e) {
    console.log(e1);
    res.status(500).json({
      success: "false",
    });
  }
};

exports.getWorkflow = async (req, res, next) => {
  try {
    const data = await Workflow.find({});
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

exports.getWorkflowById = async (req, res, next) => {
  const {id} = req.params
  try {
    const data = await Workflow.findById(id).populate('level_id');
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

exports.updateWork = (req, res, next) => {
 
    return res.status(200).json({
      success:'true',
      message: 'api working'
    })
    

}

exports.updateWorkflow = async (req, res, next) => {
  const { level, userName, status, transaction, _id } = req.body;
  try{
    let data = await Workflow.findById(_id)
    let st = data.level_id

    const levelType = await getLevelType(level, st);
    console.log('this is status', levelType);
    
    let dta = null
    dta = data.levels.find(l => l.level === level)?true:false;
    
    if(dta && (levelType != null && levelType != 'error'))
    {
      let i = 1;
      const len = data.levels.length;
      for(i=0;i<len;i++)
      {
        //console.log(data.levels[i].status);
        if(data.levels[i].level === level)
        {
          //console.log(data.levels[i].users);
          const upda = await updateStatus(data.levels[i], userName, levelType, status);
          if(upda != ('wait' || 'terminate'))
          {
            
            data.levels[i]=upda;
            console.log(data.levels[i]);
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
          } else if(upda == 'wait') {
            return res.status(403).json({
              success: 'false',
              message: 'Initial levels are not approved'
            })
          } else if(upda == 'terminate') {
            return res.status(403).json({
              success: 'false',
              message: 'Someone terminated request at initial levels'
            })
          }
          
          break;
        } else {
          if(data.levels[i].status === 'active')
            continue;
          else if(data.levels[i].status === 'terminate') {
            return res.status(403).json({
              success: 'false',
              message: 'initial level terminated'
            })
          }
          else {
            return res.status(400).json({
              success: 'false',
              message: 'Previous levels are not active'
            })
          }
        }
      }
    } else {
      console.log('level not found');
      res.status(400).json({
        success: 'false',
        message: 'level not found'
      })
    }
    
    
  } catch(e) {
      console.error(e);
      res.status(400).json({
          success: 'false',
          message: 'something bad happened'
      })
  }
};

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

updateStatus = async (data, username, levelType, status) => {
  console.log('in update Status');
  if(data.status == '')
  {
    if(levelType === 'simple')
    {
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name != username)
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
        } else {
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
    } else if(levelType == 'rr') {
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name == username)
        {
          if(status == 'approve')
          {
            data.users[i].status='approve'
          } else if(status == 'remove') {
            data.users[i].status=''
          } else if(status == 'reject') {
            data.users[i].status = 'reject'
            data.status = 'terminate'
          }
          break;
        }
      }
      let flag = 1
      for(i=0;i<len;i++)
      {
        if(data.users[i].status == '')
        {
          flag++;
        } else {
          break;
        }
      }
      if(flag == len)
      {
        data.status='active'
      }
      return data;
    } else if(levelType == 'one') {
      let i = 0;
      let len = data.users.length;
      for(i=0;i<len;i++)
      {
        if(data.users[i].name == username)
        {
          if(status == 'approve' && data.status != 'terminate')
          {
            data.users[i].status='approve'
            data.status='active'
          } else if(status == 'remove' && data.status != 'terminate') {
            data.users[i].status=''
            data.status='active'
          } else if(status == 'reject' && data.status != 'active') {
            data.users[i].status = 'reject'
            data.status = 'terminate'
          }
          return data;
          
        }
      }
    }

  } else if(data.status === 'terminate') {
    return 'terminate'
  }

  console.log(data);
  return 'hello'
}

isEverythingUnique = (arr, key) => {   
  const uniques = new Set(arr.map(item => item[key]));
  return [...uniques].length === arr.length; 
}