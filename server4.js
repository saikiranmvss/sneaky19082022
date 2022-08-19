var mysql=require('mysql');
var express=require('express');
var formidable = require('formidable');
var session = require('express-session');
var fs=require('fs');
var app = express();
const http = require('http');
const server = http.createServer(app)
const { Server } = require("socket.io");
const io = new Server(server);  
// const WebSocket = require('ws');
// const wss = new WebSocket(server);
var bodyParser = require('body-parser');
var db=mysql.createConnection({ host:'localhost',user:'root',password:'',database:'chatapp'});
app.use(session({secret: "Shh, its a secret!",saveUninitialized:true,resave:false}));
app.use(express.static(__dirname + '/public'));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view-engine','ejs');
app.get('/',function(requ,res){
    res.render('signup.ejs');
})
app.post('/signup',function(req,res){
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if(fields.files!='default_img.jpeg'){        
        var oldpath = files.files.filepath;
        var newpath = 'C:/Users/Win/node/sneaky2/public/images/' + files.files.originalFilename;
        fs.rename(oldpath, newpath, function (err) {
            console.log(err);
        });
        var filename=files.files.originalFilename;
        }else{
            var filename='default_img.jpeg';    
        }
    var sql="insert into users(name,email,phone,address,password,user_type,user_status,user_pic)values(?,?,?,?,?,?,?,?)";
    db.query(sql,[fields.name,fields.email,fields.phone,fields.address,fields.password,1,1,filename],function(err,result){
if(err){
    console.log(err);
}else{
res.json({
    msg:'success'
})
}
})
})    
})

/* login page */
app.get('/loginpage',function(req,res){
    res.render('login.ejs');
})

/* home */
var conID='';
var online_status=[];
var seenmsgs=[];
app.post('/home',function(req,res){
    var email=req.body.email;
    var password=req.body.password;
    var sql='select * from users where email=?';
    db.query(sql,[email],function(err,result){
        if(err){console.log(err)}
        if(result[0]){
        password_feed=result[0].password;
        if(password_feed==password){
            req.session.user_id=result[0].user_id;
            conID=req.session.user_id;
            res.json({
                msg:'success'
            })
        }else{
            res.json({
                msg:'password'
            })
        }
        }else{
            res.json({
                msg:'email'
            })
        }
    })
})

// SQL QUERIES

callbacking = function(user_ids){
    return new Promise((resolve,reject) => {
        var sqlN='select distinct(receiver_id) from users_messages where (receiver_id=? or sender_id=?) and receiver_id!=?;';
    db.query(sqlN,[user_ids,user_ids,user_ids],function(err,res){        
    return resolve(res);
    })
})
}
var array=[];
var msg_array=[];
var pictures_array=[];
names = function (userId) {
    var sql="select name from users where user_id=?";
    return new Promise((resolve,reject)=> {
        db.query(sql,[userId],function(err,res){
            return resolve(res[0].name);
        })
    })
}
usersImages = function (userId) {
    var sql="select user_pic from users where user_id=?";
    return new Promise((resolve,reject)=> {
        db.query(sql,[userId],function(err,res){
            return resolve(res[0].user_pic);
        })
    })
}

messagess=function(userss_id,others_uid){
    var sql="SELECT * from users_messages where (sender_id = ? and receiver_id= ?) or (sender_id=? and receiver_id=?) ORder by msg_createddate desc limit 1;";
    return new Promise((resolve,reject)=> {
        db.query(sql,[userss_id,others_uid,others_uid,userss_id],function(err,res){
            return resolve(res[0].msg_content);
        })
    })
}

Homemessagess=function(userss_id,others_uid){
    var sql="SELECT * from users_messages where (sender_id = ? and receiver_id= ?) or (sender_id=? and receiver_id=?) ORder by msg_createddate desc limit 1;";
    return new Promise((resolve,reject)=> {
        db.query(sql,[userss_id,others_uid,others_uid,userss_id],function(err,res){
            return resolve(res[0]);            
        })
    })
}

inserting= function(other,main,mesg){     

    if(seenmsgs[other]==main){
    var sql="insert into users_messages(msg_content,msg_status,receiver_id,receiver_status,sender_id,sender_status,user_id)values(?,1,?,1,?,1,?)";
    }else{
        var sql="insert into users_messages(msg_content,msg_status,receiver_id,receiver_status,sender_id,sender_status,user_id)values(?,1,?,0,?,1,?)";
    }        
    
    return new Promise((resolve,reject)=> {
        db.query(sql,[mesg,other,main,main],function(err,res){     
            if(err){
                console.log(err);
            }           
            var newidgot=res.insertId;
            var sqls='select msg_id from users_messages where msg_createddate < (select msg_createddate from users_messages where msg_id=?) and receiver_id=? and sender_id=? ORDER BY msg_createddate desc limit 1';
            return new Promise((resolve,reject)=> {
                db.query(sqls,[msg_ids,others,mine_id],function(err,result){ 
                    if(err){
                        console.log(err);
                    }else{
                        console.log(result[0].msg_id);
                    }            
        var sqlss='update users_messages set flag_pic=1 where msg_id=?';
        return new Promise((resolve,reject)=> {
            db.query(sqlss,[result[0].msg_id],function(err,resutls)
        { 
        })
        })
        })
        })
            return resolve(newidgot);                        
        })
    })
}


updateLasrtInseted = function (msg_ids,others,mine_id){ 
}

updatemsgsStart=function(mine,other){    
    var updateMsg= "UPDATE users_messages SET receiver_status = '1' WHERE (receiver_id = ? AND sender_id=?) OR (receiver_id = ? AND sender_id=?)";
    return new Promise((resolve,reject)=> {
        db.query(updateMsg,[mine,other,other,mine],function(err,res){
            if(err){
                console.log(err);
            }else{
             
            }
        });
    });
}

mainmsg= function(mined_id,othermsgid){
var sqlm='select * from users_messages where (receiver_id=? and sender_id=?) or (receiver_id=? and sender_id=?)';
return new Promise((resolve,reject)=>{
db.query(sqlm,[mined_id,othermsgid,othermsgid,mined_id],function(err,res){
    return resolve(res);
})

})
}

chatName= function(id){
    var sqlm='select name from users where user_id=?';
return new Promise((resolve,reject)=>{
db.query(sqlm,[id],function(err,res){
    return resolve(res);
})
})
}

// ends here

app.get('/homepage',async (req,res) =>{
    var receivers_ids=[];
    if(req.session.user_id){                
        elements=await callbacking(req.session.user_id);
        array.length=0;
        msg_array.length=0;        
        pictures_array.length=0;
        for(const element of elements){
        msg_array.push(await messagess(req.session.user_id,element.receiver_id));           
        pictures_array.push(await usersImages(element.receiver_id));
         array.push(await names(element.receiver_id));         
         receivers_ids.push(element.receiver_id);
        }
        res.render('home.ejs',{elements:elements,pictures_array,array,msg_array,sessioned_id:req.session.user_id,receivers_ids:receivers_ids})
}else{
        res.render('login.ejs');
    }
})



var user_picture='';
app.get('/profile_page',async(req,res)=>{
    user_picture= await usersImages(req.session.user_id);
    res.render('profile_settings.ejs',{user_picture:user_picture});
})

/* end here */
var main_user='';
app.get('/allusers',function(req,res){
    users="select * from users where user_id!=?";
    db.query(users,[req.session.user_id],function(err,result){
        res.render('users.ejs',{users:result,sessioned_id:req.session.user_id});    
    })
    main_user=req.session.user_id;
})

// all $.post requests in the app begins here 
var pictures='';
app.post('/request', async(req,res) =>{

    var automsgsmain='';    
    autoelements=await callbacking(req.body.mine_id);  
        for(const element of autoelements){                        
            var msgsdisplay=await Homemessagess(req.body.mine_id,element.receiver_id);            
            pictures=await usersImages(element.receiver_id);
            if(msgsdisplay.sender_id!=req.body.mine_id && msgsdisplay.receiver_status!=1){
            var msgsdisplays='<strong>'+msgsdisplay.msg_content+'</strong>';
            }else{
            var msgsdisplays=msgsdisplay.msg_content;
            }
            automsgsmain+='<div class="list-item" data-id="19"><div><div><img src="images/'+pictures+'" style="width: 50px;height: 48px;border-radius: 60px;"></div></div><div class="flex"><a href="http://localhost:9999/chat-page/'+element.receiver_id+'" class="item-author text-color" data-abc="true">'+await names(element.receiver_id)+'</a><div class="item-except text-muted text-sm h-1x">'+msgsdisplays+'</div></div><div class="no-wrap" style="position: absolute;right: 0;"><div class="item-date text-muted text-sm d-md-block">13/12 18</div></div></div>';
        }        
        let buff = new Buffer.from(automsgsmain);
        let base64data = buff.toString('base64');        
        res.json({
            msg:base64data
        })
})

// app.post('/updateMsgs',async(req,res)=>{
// var MsgUpdateMineId=req.body.mine_id;
// var MsgUpdateOthersId=req.body.others_main_id;
// seenmsgs[MsgUpdateMineId]=MsgUpdateOthersId;    
//         await updatemsgsStart(MsgUpdateMineId,MsgUpdateOthersId);    
// })

// ends here

// socket related code

var users_idss=[];
var msegs={};
var autoelements='';
var chat_load_pic='';
var objmsg=[];
io.on('connection', (socket) => {

socket.emit('connected',socket.id);
socket.on('store',function(data){
    users_idss[data[0]]=data[1];
})
    socket.on('send_message', async (data)=> {
        inserted = await inserting(data.other,data.user_id,data.mesg);        
        if(users_idss[data.other]!=''){
            chat_load_pic=await usersImages(data.other);
             msg='<div class="d-flex flex-row justify-content-start mb-4" id="imgDiv_'+inserted+'" datas="'+inserted+'"><img src="../images/'+chat_load_pic+'" alt="avatar 1" id="msgUser_'+inserted+'" style="width: 45px; height: 100%;border: 2px solid rgb(239 239 239);border-radius: 20px;"><div><p class="small p-2 ms-3 mb-1 rounded-3" style="background-color: #f5f6f7;">'+data.mesg+'</p></div><input type="hidden" id="hiddenvariable" value="'+inserted+'"></div>';                          
             objmsg[0]=inserted;
             objmsg[1]=msg;
            socket.to(users_idss[data.other]).emit('msg_received',objmsg);
        }
    })
var chat_pic='';
socket.on('get_msg',async (data)=>{
    mainmsging=await mainmsg(data[0],data[1]);
    chat_pic=await usersImages(data[1]);
    var dismsg='';
    for(const mainmsgings of mainmsging){        
        if(mainmsgings.sender_id==data[0]){            
            dismsg+='<div class="d-flex flex-row justify-content-end"><div><p class="small p-2 mb-1 text-white rounded-3 bg-primary">'+mainmsgings.msg_content+'</p></div></div>';
        }else{             
            dismsg+='<div class="d-flex flex-row justify-content-start mb-4"><img src="../images/'+chat_pic+'" alt="avatar 1" style="width: 45px; height: 100%;border: 2px solid rgb(239 239 239);border-radius: 20px;"><div><p class="small p-2 ms-3 mb-1 rounded-3" style="background-color: #f5f6f7;">'+mainmsgings.msg_content+'</p></div></div>';}
    }
    socket.emit('dis',dismsg);    
    function checkedStat(){
        socket.emit('status',online_status[data[0]]);
        if(online_status[data[1]]=='online'){        
            socket.emit('statuss',1);
        }else{
            socket.emit('statuss',0);
        } 
    }   
    setInterval(checkedStat, 1500);      
    socket.emit('entered',data);    
})

socket.on('msgs_see',async(data)=>{
 seenmsgs[data[0]]=data[1];   
var update = await updatemsgsStart(data[0],data[1]); 
})

socket.on('typing',function(data){
    var typeMsg='typing';
    var NottypeMsg='nottyping';
    if(data[2]=='yes'){
    socket.to(users_idss[data[1]]).emit('display',typeMsg);
    }else{
        socket.to(users_idss[data[1]]).emit('display',NottypeMsg);
    }
})

socket.on("seenmsg",async(response)=>{  
    seenmsgs[response[0]]=response[1];    
})
    
//     if(response[1]!=0){
//         await updatemsgsStart(response[0],response[1]);
//     }
    // if(seenmsg_time!=''){
    // clearTimeout(seenmsg_time);
    // }
    // var seenmsg_time=setTimeout(() => {
    //     seenmsgs[response[0]]=0;
    // }, 1500);

socket.on('online',function(data){  
    online_status[data]='online';
    // seenmsgs[data]=0;
})

socket.on('logout',function(data){
    online_status[data]='offline';
})

socket.on('/goout',function(){
    socket.disconnect();
})
var user_chat_pic='';
socket.on('name',async(data) => {
    chatNames=await chatName(data);
    user_chat_pic=await usersImages(data);
    socket.emit('usersname',[chatNames[0].name,user_chat_pic]);
})


// socket.on('checking',async(data) => {

// socket.emit('sent',automsgsmain);

// });
})

// End here

app.get('/chat-page/:uid',function(req,res){
    res.render('chat-window.ejs',{otherid:req.params.uid,mine:req.session.user_id});
})




app.get('/logout',function(req,res){    
    req.session.destroy();    
    res.render('login.ejs');
})
 server.listen(9999)