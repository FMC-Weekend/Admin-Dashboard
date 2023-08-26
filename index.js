// ENVIRONMENT VARIABLES CONFIGURATION
const dotenv = require('dotenv');
dotenv.config();
const axios=require("axios");
const _=require("lodash");
// MODULES & IMPORTS
const express = require("express");
const app = express();
const methodOverride = require("method-override");
const mongoose = require('mongoose');
const cors = require('cors');

app.use(cors());


// MIDDLEWARE
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(methodOverride('_method'));
app.use(express.static('.'));
app.set('view engine', 'ejs');
//Admin DashBoard
app.use(express.static("public"));
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const admin_auth = require('./middleware/admin_auth');
app.use(cookieParser());
app.get('/', (req, res) => {
  res.render('admin_login');
}
);
app.get('/register',admin_auth, (req, res) => {
  res.render('admin_register');
});
const userModel = require('./models/admin_user');
//bcrypt
const bcrypt = require('bcryptjs');

const saltRounds = 10;
app.post('/register',admin_auth, async (req, res) => {
  try {

    var { username, password, name } = req.body;
    var salt = bcrypt.genSaltSync(saltRounds);
    var hash = bcrypt.hashSync(password, salt);
    password = hash;
    const user = new userModel({
      username: username,
      password: password,
      name: name
    });
    const token = await user.generateAuthToken(); //model me jakar generateAuthToken function ko call kia
    //cookie me token ko save kia
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 300000),
      httpOnly: true,
      // secure:true
    });
    // console.log(user);
    await user.save();
    res.status(201).render('login');
  } catch (error) {
    res.status(400).render('error');
    console.log(error);
  }
});
app.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await userModel.findOne({
      username: username,
      // password:password       
    });
    // console.log(users)
    const token = await users.generateAuthToken(); //model me jakar generateAuthToken function ko call kia
    // console.log(token);
    res.cookie("jwt", token, {
      expires: new Date(Date.now() + 3000000),
      httpOnly: true,
      // secure:true
    });
    // console.log(req.cookies.jwt);
    if (users.username === username && bcrypt.compareSync(password, users.password)) {
      // res.send('login successfull');
      res.render("adminDashboard", {
        Details: Details,
        total: total,
        totalOrders: totalOrders,
        totalPayments: totalPayments
      });
    }
    else {
      res.render('error');
    }

  } catch (error) {
    res.render('error');
    // res.status(400).render('error');
    // console.log(error);
  }
});
const uniqueParticipants=new Set();
const noPayment=[];
const Details = [];
const iitbhuDetails=[];
const set=new Set();
var total;
var totalOrders = 0;
var trueUser=0;
var totalPayments = 0;
const http = require("https");
app.get("/admindashboard", admin_auth, function (req, res) {
  res.render("adminDashboard", {
    Details: Details,
    total: total,
    totalOrders: totalOrders,
    totalPayments: totalPayments
  });

});
app.get("/admindashboarduser", admin_auth, function (req, res) {
  res.render("users", {
    Details: Details,
    total: total,
    totalOrders: totalOrders,
    totalPayments: totalPayments
  });

});
app.get("/nopayment", admin_auth, function (req, res) {
  res.render("nopayment", {
    noPayment: noPayment,
    total: total,
    totalOrders: totalOrders,
    totalPayments: totalPayments
  });

});
app.post('/nopaymentverify',(req,res)=>{
  res.send("Payment Status Changed successfully.");
  const protocol = req.protocol;
  const host = req.hostname;
  const url = req.originalUrl;
  const port = process.env.PORT;

  const fullUrl = `${protocol}://${host}:${port}${url}`
  
  const responseString = `Full URL is: ${fullUrl}`;                       
  // res.send(responseString); 
})


app.get('/:email',admin_auth,(req,res)=>{
  // res.send(req.params.email);
  const dynamicEmail=_.lowerCase(req.params.email);
  Details.forEach((data)=>{
    const email=_.lowerCase(data.email);
    if(email===dynamicEmail){
      // res.send(data);
      const arrr=[];
      arrr.push(data);
      res.render("particular_user",{
        heading:data.name,
        email:email,
        Details: arrr,
      })
    }
  })
})
app.get('/events',admin_auth, (req, res) =>{
  // res.send("eventso");
  res.render('event_details',{
    Details: uniqueParticipants,
    total: total,
    totalOrders: totalOrders,
    totalPayments: totalPayments
  })
})
app.get('/events/:event',admin_auth,(req,res)=>{
  console.log(req.params.event);
  // res.send(req.params.event);
  const dynamicUrl=_.lowerCase(req.params.event);
  uniqueParticipants.forEach((data)=>{
    data.userCart.cartItems.forEach((datas)=>{
      const eventName=_.lowerCase(datas.title);
      // console.log(eventName);
      // console.log(datas.verifyStatus);
      if(eventName===dynamicUrl){
        
        res.render("particular_events",{
          heading:datas.title,
          Details: Details,
        })
      }
    })
  })
  
})
const options = {
  "method": "GET",
  "hostname": "fmcw-backend1.onrender.com",
  "port": null,
  "path": "/api/alluser",
  "headers": {
    "Accept": "*/*",
  }
};
const req = http.request(options, function (res) {
  const chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    const body = Buffer.concat(chunks);
    const n = body.toString();
    const k = JSON.parse(n);
    k.data.forEach((data,index)=>{
      var re1 = /@itbhu.ac.in\s*$/;
      var re2 = /@iitbhu.ac.in\s*$/;
      // console.log(data.email);
      if (re1.test(data.email) || re2.test(data.email)) {
         iitbhuDetails.push(data);
       }
       else{
        
        if(data.userCart.cartItems.length>0){
          data.userCart.cartItems.forEach((datas)=>{
            // console.log(datas.verifyStatus);
            var count=0;
            if(datas.verifyStatus===true){
              
                Details.push(data);
              
              
              uniqueParticipants.add(data);
              totalOrders++;
              // console.log(datas.price);
              // console.log(datas.title);
              console.log(data.email);
              
              totalPayments+=datas.price;
              // count++;
              set.add(data.email);
            }
            else{
              noPayment.push(data);
             }
          })
        }
        total=set.size;
       }
    })
  });
});

req.end();

// ROUTES
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Running successfully' });
})
app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Given route does not exist'
  })
})
// const decrypted = CryptoJS.AES.decrypt(encrypted, "Message").toString(CryptoJS.enc.Utf8);
// DATABASE CONNECTION
// const DB = process.env.local_mongo;

const DB = process.env.DATABASE;
mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Successfully connected to database');
}).catch((err) => {
  console.log('There was some error connecting to the database');
  console.log(err);
})


// APP SETUP
// app.listen(process.env.PORT || 8000, function (err, result) {
//   console.log(`Server is running at port! ${process.env.PORT}`);
// });
module.exports=app;