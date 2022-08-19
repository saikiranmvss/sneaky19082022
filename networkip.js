var express = require('express');
var app = express();
const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

app.get('/test',function(requ,res){
    res.render('signup.ejs');
})

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
var servermain=results['Wi-Fi'][0]+':3268/test';
var http = require("http");
var url = require("url");

http.createServer(function(req, res) {  
  res.writeHead(301,{Location: servermain});
  res.end();
}).listen(3268);