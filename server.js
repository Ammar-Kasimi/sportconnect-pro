const http= require('http')
const serverStatic = require('serve-static')
const bodyParser = require('body-parser')

const router = require('./src/core/router')
const serve = serverStatic('public' ,{index:false})

const parseForm = bodyParser.urlencoded({extended:false})

const server =http.createServer((req,res)=>{
    serve(req,res,()=>{
        parseForm(req,res,()=>{
            router.lookup(req,res)
        })
    })
})
const Port = process.env.PORT || 3000
server.listen(Port,()=>{
    console.log(`Sconnect Pro server running on http://localhost:${Port}`)
})
