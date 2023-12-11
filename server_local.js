const mongoclient = require("mongodb").MongoClient;
const ObjId = require("mongodb").ObjectId;
const url =
  "mongodb+srv://admin:0000@cluster0.okckkz8.mongodb.net/?retryWrites=true&w=majority";
let mydb;

mongoclient
  .connect(url)
  .then((client) => {
    mydb = client.db("myboard");

    app.listen(8080, function () {
      console.log("포트 8080으로 서버 대기중 ... ");
    });
  })
  .catch((err) => {
    console.log(err);
  });

// MySQL + nodejs 접속 코드
var mysql = require("mysql2");
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "0000",
  database: "myboard",
});

conn.connect();

const express = require("express");
const app = express();
let imagepath;
const sha = require("sha256");

app.use(
  "/public",
  express.static("public", { "Content-Type": "text/css" })
);
let session = require("express-session");
app.use(
  session({
    secret: "dkufe8938493j4e08349u",
    resave: false,
    saveUninitialized: true,
  })
);

// body-parser 라이브러리 추가
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
// 정적 파일 라이브러리 추가
app.use(express.static("public"));


app.get("/", function (req, res) {
  if (req.session.passport) {
    console.log("세션 유지");
    res.render("index.ejs", { user: req.session.passport });
  } else {
    console.log("user : null");
    res.render("index.ejs", { user: null });
  }
});
app.get("/list", function (req, res) {

  mydb
    .collection("post")
    .find()
    .toArray()
    .then((result) => {
      console.log(result);
      res.render("list.ejs", { data: result });
    });
});

//'/enter' 요청에 대한 처리 루틴
app.get("/enter", function (req, res) {
  res.render("enter.ejs");
});

 //'/save' 요청에 대한 post 방식의 처리 루틴
 app.post("/save", function (req, res) {
   console.log(req.body.title);
   console.log(req.body.content);
   //몽고DB에 데이터 저장하기
   mydb
     .collection("post")
     .insertOne({
       title: req.body.title,
       content: req.body.content,
       date: req.body.someDate,
       path: imagepath
     })
     .then((result) => {
       console.log(result);
       console.log("데이터 추가 성공");
     });

   res.redirect("/list");
 });

app.post("/delete", function (req, res) {
  console.log(req.body);
  req.body._id = new ObjId(req.body._id);
  mydb
    .collection("post")
    .deleteOne(req.body)
    .then((result) => {
      console.log("삭제완료");
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send();
    });
});

//'/content' 요청에 대한 처리 루틴
app.get("/content/:id", function (req, res) {
  console.log(req.params.id);
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("content.ejs", { data: result });
    });
});

//'/edit' 요청에 대한 처리 루틴
app.get("/edit/:id", function (req, res) {
  req.params.id = new ObjId(req.params.id);
  mydb
    .collection("post")
    .findOne({ _id: req.params.id })
    .then((result) => {
      console.log(result);
      res.render("edit.ejs", { data: result });
    });
});

app.post("/edit", function (req, res) {
  console.log(req.body);
  req.body.id = new ObjId(req.body.id);
  mydb
    .collection("post")
    .updateOne(
      { _id: req.body.id },
      {
        $set: {
          title: req.body.title,
          content: req.body.content,
          date: req.body.someDate,
        },
      }
    )
    .then((result) => {
      console.log("수정완료");
      res.redirect("/list");
    })
    .catch((err) => {
      console.log(err);
    });
});
// multer 설정
let multer = require("multer");

let storage = multer.diskStorage({
  destination: function (req, file, done) {
    done(null, "./public/image");
  },
  filename: function (req, file, done) {
    done(null, file.originalname);
  },
});

let upload = multer({ storage: storage });

app.post("/photo", upload.single("picture"), function (req, res) {
  // Check if a file was uploaded
  if (req.file) {
    console.log(req.file.path);
    // Save the image path
    imagepath = "\\" + req.file.path;
  } else {
    console.log("No file uploaded");
    // Handle the case where no image is uploaded, set a default path or do nothing
  }
});

app.get("/image/:imgname", function (req, res) {
  // 이미지 서빙
  res.sendFile(__dirname + "/public/image/" + req.params.imgname);
});

 app.get("/session", function (req, res) {
   console.log(req.session.milk);
   if(isNaN(req.session.milk))
   {
     req.session.milk = 0;
   }
   req.session.milk = req.session.milk + 1000;
   res.send("session : " + req.session.milk + "원");
 });

app.get("/login", function (req, res) {
  console.log(req.session);
  if (req.session.user) {
    console.log("세션 유지");
    res.render("index.ejs", { user: req.session.user });
  } else {
    console.log("로그인 페이지");
    res.render("login.ejs");
  }
});

 app.post("/login", function (req, res) {
   console.log("아이디 : " + req.body.userid);
   console.log("비밀번호 : " + req.body.userpw);
   //res.send('로그인 되었습니다.');
   mydb
     .collection("account")
     .findOne({ userid: req.body.userid })
     .then((result) => {
       if (result.userpw == req.body.userpw) {
        req.session.user = req.body;
        console.log("새로운 로그인");
         res.render("index.ejs", { user: req.session.user });
       } else {
         res.render("login.ejs");
       }
     });
 });

app.get("/logout", function (req, res) {
  console.log("로그아웃");
  req.session.destroy();
  res.render("index.ejs", { user: null });
});

app.get("/signup", function (req, res) {
  res.render("signup.ejs");
});

app.post("/signup", function (req, res) {
  console.log(req.body.userid);
  console.log(req.body.userpw);
  console.log(req.body.usergroup);
  console.log(req.body.useremail);

  mydb
    .collection("account")
    .insertOne({
      userid: req.body.userid,
      userpw: req.body.userpw,
      usergroup: req.body.usergroup,
      useremail: req.body.useremail,
    })
    .then((result) => {
      console.log("회원가입 성공");
    });
  res.redirect("/");
});

app.get('/search', function(req, res){
  console.log(req.query);
  mydb
  .collection("post")
  .find({ title:req.query.value }).toArray()
  .then((result) => {
    console.log(result);
    res.render("sresult.ejs", { data: result });
  })
});