var mysql=require('mysql');
const lib = require("./functions");
var express=require('express');
var formidable = require('formidable');
var session = require('express-session');
var fs=require('fs');
var app = express();
const http = require('http');
const server = http.createServer(app)
const { Server } = require("socket.io");
const io = new Server(server);  
const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
        const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
        if (net.family === familyV4Value && !net.internal) {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}   
var servermain=results['Wi-Fi'][0];
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
    res.render('signup.ejs',{servermain:servermain});
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
    res.render('login.ejs',{servermain:servermain});
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
var resultingId='';
callbacking = function(user_ids){    
    return new Promise((resolve,reject) => {
        // var sqlN='select distinct(receiver_id) from users_messages where (receiver_id=? or sender_id=?) and receiver_id!=?;';
        var sqlN='select distinct(receiver_id) from users_messages where (receiver_id=? or sender_id=?);';
    db.query(sqlN,[user_ids,user_ids],function(err,res){    
        var sqlNs='select distinct(sender_id) from users_messages where (receiver_id=? or sender_id=?);';           
        if(res[0].receiver_id==user_ids){
db.query(sqlNs,[user_ids,user_ids],function(errs,ress){    
     resultingId=ress;
    // return resolve(ress[0]);
})
        }else{            
     resultingId=res;
            // return resolve(res[0]);
        }                
        console.log(resultingId);
        return resolve(resultingId);            
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
var friendsarray=[];
var usersdatares=[];
userFrnds= function(){
    var fetched="select * from users";    
    return new Promise((resolve,reject) =>{
        db.query(fetched,function(err,res){                        
            for(z=0;z<res.length;z++){                                                
                usersdatares[res[z].user_id]=res[z];
            }
            return resolve(usersdatares);
        })
    })
}

messagess=function(userss_id,others_uid){
    var sql="SELECT * from users_messages where (sender_id = ? and receiver_id= ?) or (sender_id=? and receiver_id=?) Order by msg_createddate desc limit 1;";
    return new Promise((resolve,reject)=> {
        db.query(sql,[userss_id,others_uid,others_uid,userss_id],function(err,res){
            return resolve(res[0]);            
        })
    })
}

Homemessagess=function(userss_id,others_uid){
    var sql="SELECT * from users_messages where (sender_id = ? and receiver_id= ?) or (sender_id=? and receiver_id=?) Order by msg_createddate desc limit 1;";    
    return new Promise((resolve,reject)=> {
        db.query(sql,[userss_id,others_uid,others_uid,userss_id],function(err,res){    
            console.log(userss_id,others_uid);        
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
            return resolve(res.insertId);            
        })
    })
}

updateLasrtInseted = function (msg_ids,others,mine_id){
    var sqls='select msg_id from users_messages where msg_createddate < (select msg_createddate from users_messages where msg_id=?) and receiver_id=? and sender_id=? ORDER BY msg_createddate desc limit 1';
    return new Promise((resolve,reject)=> {
        db.query(sqls,[msg_ids,others,mine_id],function(err,res){ 
            if(err){
                console.log(err);
            }else{
                
            }          
            var oldId=res[0].msg_id;  
var sqlss='update users_messages set flag_pic=1 where msg_id=?';
return new Promise((resolve,reject)=> {
    db.query(sqlss,[res[0].msg_id],function(err,res){ 
        return resolve(oldId)
    })
})
        })
})
}

userdetails=function(id){
    var details="select * from users where user_id=?";
    return new Promise((resolve,reject)=>{
        db.query(details,[id],function(err,res){
            if(err){
                console.log(err);
            }else{                
                return resolve(res);
            }
        })
    })
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

dpupdate = function(id){
    var dpupdating='update users set user_pic="default.png" where user_id = ?';
    return new Promise((resolve,reject)=>{
        db.query(dpupdating,[id],function(err,res){
            if(err){
                console.log(err);
                return resolve('error');
            }else{
                return resolve('success');
            }
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
        msg_array.push(await messagess(req.session.user_id,element));           
        pictures_array.push(await usersImages(element.receiver_id));
         array.push(await names(element.receiver_id));         
         receivers_ids.push(element.receiver_id);
        }        
        res.render('home.ejs',{servermain:servermain,elements:elements,pictures_array,array,msg_array,sessioned_id:req.session.user_id,receivers_ids:receivers_ids})
}else{
        res.render('login.ejs',{servermain:servermain});
    }
})

var mainfrnd=[];
app.get('/friends',async(req,res)=>{   
    const showfun =await lib.fetchfrnds(req.session.user_id);       
    const  userFrndsMain= await userFrnds();      
    if(showfun[0].friends!=null){
        var ownfrnds=JSON.parse(showfun[0].friends);
        for(i=1;i<usersdatares.length;i++){            
            if(usersdatares[i].user_id!=req.session.user_id){
                var number=usersdatares[i].user_id;
                var numbers=number.toString();                
                if(ownfrnds.includes(numbers)){                        
                    usersdatares[i]='';
            }
            }    
        }
        usersdatares[req.session.user_id]='';        
    }else{
        for(i=1;i<usersdatares.length;i++){
            if(usersdatares[i].user_id==req.session.user_id){
                usersdatares.splice(i,1);

            }
        }
    }
    res.render('friends_page.ejs',{servermain:servermain,usersdatares:usersdatares,id:req.session.user_id});
})

app.post('/removedp',async(req,res)=>{
updateDp=await dpupdate(req.body.users_id);
res.json({
    msg:updateDp
})
})

app.get('/edit_profile',async(req,res)=>{    
    detailss=await userdetails(req.session.user_id);    
    res.render('edit_profile.ejs',{detailss:detailss,servermain:servermain})
})


var user_picture='';
app.get('/profile_page',async(req,res)=>{
    user_picture= await usersImages(req.session.user_id);
    res.render('profile_settings.ejs',{user_picture:user_picture,sessioned_id:req.session.user_id,servermain:servermain});
})
/* end here */
var main_user='';
app.get('/allusers', async (req,res)=> {    
    var arrayfrnds=[];
    const saveId= await lib.saveId(req.session.user_id);
     const usersmainfrnds = await lib.allusersfun(saveId);   
    //  console.log(usersmainfrnds);  
     for(i=0;i<usersmainfrnds.length;i++){
        // console.log(i);
        arrayfrnds[i]=await lib.singleUser(usersmainfrnds[i]);  
     }        
    res.render('users.ejs',{users:arrayfrnds,sessioned_id:req.session.user_id,servermain:servermain});   
    main_user=req.session.user_id;
})

// all $.post requests in the app begins here 
var pictures='';
app.post('/request', async(req,res) =>{

    var automsgsmain='';    
    autoelements=await callbacking(req.body.mine_id);         
        for(const element of autoelements){                 
            // console.log(req.body.mine_id);
            // console.log(element.receiver_id);       
            var msgsdisplay=await Homemessagess(req.body.mine_id,element);            
            pictures=await usersImages(element.receiver_id);
            if(msgsdisplay.sender_id!=req.body.mine_id && msgsdisplay.receiver_status!=1){
            var msgsdisplays='<strong>'+msgsdisplay.msg_content+'</strong>';
            }else{
            var msgsdisplays=msgsdisplay.msg_content;
            }            
            automsgsmain+='<div class="list-item" data-id="19"><div><div><img src="images/'+pictures+'" style="width: 50px;height: 48px;border-radius: 60px;"></div></div><div class="flex"><a href="http://'+servermain+':9999/chat-page/'+element.receiver_id+'" class="item-author text-color" data-abc="true">'+await names(element.receiver_id)+'</a><div class="item-except text-muted text-sm h-1x">'+msgsdisplays+'</div></div><div class="no-wrap" style="position: absolute;right: 0;"><div class="item-date text-muted text-sm d-md-block">13/12 18</div></div></div>';
        }        
        let buff = new Buffer.from(automsgsmain);
        let base64data = buff.toString('base64');        
        res.json({
            msg:base64data
        })
})
// ends here

app.post('/addfrnd',async(req,res)=>{
    var frndid=req.body.id;
    var mine_id=req.body.mine_id
    const addfrnds =await lib.addfrnd(mine_id,frndid);
})

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
            chat_load_pic=await usersImages(data.user_id);
             msg='<div class="d-flex flex-row justify-content-start" id="imgDiv_'+inserted+'" datas="'+inserted+'"><img src="../images/'+chat_load_pic+'" alt="avatar 1" id="msgUser_'+inserted+'" style="position: relative;top: 15px;width: 25px; height: 100%;border: 2px solid rgb(239 239 239);border-radius: 20px;"><div><p class="small p-2 mb-1 rounded-3" style="background-color: #f5f6f7;">'+data.mesg+'</p></div><input type="hidden" id="hiddenvariable" value="'+inserted+'"></div>';                          
             objmsg[0]=inserted;
             objmsg[1]=msg;
            socket.to(users_idss[data.other]).emit('msg_received',objmsg);
        }                
        updated=await updateLasrtInseted(inserted,data.user_id,data.other);        
        // console.log(users_idss[data.other]);        
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
            if(mainmsgings.flag_pic==1){
                dismsg+='<div class="d-flex flex-row justify-content-start" data="1"><img src="../images/'+chat_pic+'" id="imgDiv_'+mainmsgings.msg_id+'" alt="avatar 1" style="position: relative;top: 15px;width: 25px; height: 100%;border: 2px solid rgb(239 239 239);border-radius: 20px;"><div><p class="small p-2 mb-1 rounded-3" style="background-color: #f5f6f7;">'+mainmsgings.msg_content+'</p></div></div>';
            }else{
                dismsg+='<div class="d-flex flex-row justify-content-start" data="1"><div id="tempdiv" style="width: 25px;height: 100%;border-radius: 20px;"></div><div><p class="small p-2 mb-1 rounded-3" style="background-color: #f5f6f7;">'+mainmsgings.msg_content+'</p></div></div>';;            
            }            
        }            
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

socket.on('online',function(data){  
    online_status[data]='online';    
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
})

// End here

app.get('/chat-page/:uid',function(req,res){
    res.render('chat-window.ejs',{otherid:req.params.uid,mine:req.session.user_id,servermain:servermain});
})

app.get('/logout',function(req,res){    
    req.session.destroy();    
    res.render('login.ejs',{servermain:servermain});
})
 server.listen(9999)