require('dotenv').config();
const express        = require("express");
const app            = express();
const ejs            = require("ejs");
const mongoose       = require("mongoose");
const bodyParser     = require("body-parser");
const User           = require("./models/user");
const UserList       = require("./models/userList");
const cookieParser   = require('cookie-parser'); 
const session        = require('express-session');
const flash          = require('connect-flash');
const bcrypt         = require('bcrypt');
const saltRounds     = 10;
const methodOverride = require("method-override");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(cookieParser(process.env.SECRET));
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

mongoose.connect("mongodb://0.0.0.0:27017/examples", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(()=> {
  console.log("Successfully connected to mongoDB.");
}).catch((error) => {
  console.log("Connection failed.");
  console.log(error);
});

app.get("/", (req, res) => {
  // console.log('Cookies: ', req.cookies);
  console.log('首頁 SessionID:', req.sessionID); 
  res.render("index");
});

app.get("/dayPlan/:time", (req, res) => {
  console.log("路由: /dayPlan/:time");
  let { time } = req.params;
  console.log("req.params:", req.params);
  console.log("time:", req.params.time);
  res.render("todolist", { time });  // add new Page for User --userTodoList
});

/* 取得當前登入的使用者資訊 */
app.get("/api/user", (req, res, next) => {
  try{ 
    // console.log("req.session.user", req.session.user);
    if(req.session.user){
      res.status(200).json({
        "data": {
          "id": req.session.user._id,
          "name": req.session.user.name,
          "email": req.session.user.email
        }
      });
      console.log("已驗證 SessionID", req.sessionID);  
    }else{
      res.json({
        "data": null  
      }); 
      console.log("未驗證 SessionID", req.sessionID);
      console.log("未驗證 Session", req.session);
    }
  }catch(err){
    next(err);
  }  
});

/* 登入 */
app.patch("/api/user", async (req, res, next) => {
  console.log('===== [DBG][Sign_In] =====');
  let {name, email, password} = req.body;

  try{
    let foundUser = await User.findOne({ email });
    // console.log("登入", foundUser);

    if(foundUser){
      bcrypt.compare(password, encrypted(password), (err, result) => {
        if(err){
          next(err);
        }
        if(result === true){
          req.session.user = foundUser;
          res.status(200).json({
            "ok": true
          });
          console.log("已登入 Session", req.session);
          console.log("已登入 SessionID", req.sessionID);
        }else{
          res.status(400).json({
            "error": true,
            "message": "Email 或 密碼，輸入錯誤"
          });
          console.log("未登入 Session", req.session);
          console.log("未登入 SessionID", req.sessionID);
        }
      });
    }else{
      res.status(400).json({
        "error": true,
        "message": "Email 或 密碼，輸入錯誤"
      });
    }
  }catch(err){
    next(err);
  }
});

/* 加密 */
function encrypted(password){
  const hash = bcrypt.hashSync(password, saltRounds);
  password   = hash;
  // console.log("Hash: ", hash);
  return password; 
};
// console.log("Encrypted :", encrypted('123456'));

/* 註冊 */
app.post("/api/user", async (req, res, next) => {
  console.log('===== [DBG][Sign_Up] =====');
  let {name, email, password} = req.body;

  try{
    let foundUser = await User.findOne({ email });
    // console.log('註冊:', foundUser);

    if(foundUser){
      res.status(400).json({
        "error": true,
        "message": "此 Email 已有人使用，請試試其他 Email。"
      });
      // console.log("== foundUser ==", foundUser);
    }else{
      let newUser = new User({
        name,
        email,
        password: encrypted(password),
      });
      newUser
      .save()
      .then(() => {
        res.status(200).json({ "ok": true  });
        // console.log("== newUser ==", newUser);
      }) 
    }
  }catch(err){
    next(err);
  }      
});

/* 登出 */
app.delete("/api/user", (req, res, next) => {
  console.log('===== [DBG][Sign_Out] =====');
  try{
    req.session.destroy();
    res.status(200).json({
      "ok": true
    });
    console.log("登出 Session", req.session);
    console.log("登出 SessionID", req.sessionID);
  }catch(err){
    next(err);
  }
});

async function searchDatabaseByTime(userId, year, month, day){

  console.log('===== [DBG][Search_Database_By_Time] =====');

  let foundUserList = await UserList.find({
    userId : userId,
    year: { $eq: parseInt(year) },
    month: { $eq: parseInt(month) },
    day: { $eq: parseInt(day) }
  });
  // console.log('foundUserList: ', foundUserList);

  return foundUserList; 
}

/* 取得當天的待辦清單資訊 */
app.get("/api/dayPlan/:time", async(req, res, next) => {
  console.log('===== [DBG][Get_Date_Todolist] =====');
  console.log("路由: /api/dayPlan/:time");
  let { time } = req.params;
  let timeArray = time.split('-');
  
  try{
    if(req.session.user){
      const userId = req.session.user._id;
      const year   = timeArray[0];
      const month  = timeArray[1];
      const day    = timeArray[2];
      let searchDbResult = await searchDatabaseByTime(userId, year, month, day);
      // console.log('searchDbResult: ', searchDbResult);
      if(searchDbResult.length === 0){
        // console.log("== [沒有值] 可讀取 ==", searchDbResult);
        res.json({
          "data": searchDbResult
        });
        return;
      }
      // console.log("== [有值] 可讀取 ==", searchDbResult);
      res.status(200).json({
        "data": searchDbResult
      }); 
    }
    else{  
      console.log("== 沒有登入就無法讀取內容，內容呈現空值 ==");
      res.status(403).json({
        "error": true,
        "message": "未登入系統，拒絕存取!"
      });
    }
  }catch(err){
    next(err);
  } 
});

async function searchSameTimeTodoItem(userId, year, month, day, hours, minutes){

  console.log('===== [DBG][Search_SameTime_TodoItem] =====');

  let foundSameTimeTodoItem = await UserList.find({
    userId : userId,
    year: { $eq: parseInt(year) },
    month: { $eq: parseInt(month) },
    day: { $eq: parseInt(day) },
    "todoList.hours" : { $eq: parseInt(hours) },
    "todoList.minutes" : { $eq: parseInt(minutes) }, 
  });
  // console.log('foundSameTimeTodoItem: ', foundSameTimeTodoItem); 

  if(foundSameTimeTodoItem.length !== 0) 
    return true;

  return false;
}

/* 建立新的代辦事項，並儲存到資料庫 */
app.post("/api/dayPlan", async (req, res, next) => {
  console.log('===== [DBG][Add_One_Todolist] =====');
  console.log("req.session: ", req.session);
  let {year, month, day, todoList} = req.body;
  let hours   = parseInt(todoList.hours);
  let minutes = parseInt(todoList.minutes);
  
  try{
    if(req.session.user){
      let newUserList = await new UserList({
        userId: req.session.user._id,
        year  : parseInt(year),
        month : parseInt(month),
        day   : parseInt(day),
        todoList: todoList
      });
      const userId = newUserList.userId;
      let foundSameTimeTodoItem = await searchSameTimeTodoItem(userId, year, month, day, hours, minutes);

      if(foundSameTimeTodoItem){
        res.status(409).json({
          "error": true,
          "message": "已有相同時間的待辦事項，請重新輸入!"
        });
        return;
      }

      newUserList
      .save()
      .then(() => {
        console.log("== 建立成功 ==", newUserList);  
        res.status(200).json({
          "ok": true,
          "message": "建立成功!"
        });
      })
      .catch((e) => {
        console.log("== 建立失敗 ==");
        console.log(e);
        res.status(400).json({
          "error": true,
          "message": "建立失敗，請注意輸入是否正確或完整!"
        });
      })  
    }else{
      res.status(403).json({
        "error": true,
        "message": "請先登入，才能新增待辦事項!"
      });
    }   
  }catch(err){
    next(err);
  }   
});

async function searchTodoId(userId, year, month, day, hours, minutes){

  console.log('===== [DBG][Search_Todo_Id] =====');

  let foundTodoId = await UserList.findOne({
    userId : userId,
    year: { $eq: parseInt(year) },
    month: { $eq: parseInt(month) },
    day: { $eq: parseInt(day) },
    "todoList.hours" : { $eq: parseInt(hours) },
    "todoList.minutes" : { $eq: parseInt(minutes) }, 
  });
  
  foundTodoId = foundTodoId._id.valueOf();
  console.log('[BDG 321]foundTodoId: ', typeof(foundTodoId));
  return foundTodoId; 
}

/* 刪除 1 筆待辦事項 */
app.delete("/api/dayPlan", async (req, res, next) => {
  console.log('===== [DBG][Delete_One_TodoItem] =====');
  console.log("[DBG 328]req.session: ", req.session);
  let {year, month, day, todoList} = req.body;
  
  try{
    if(req.session.user){
      let userId      = req.session.user._id;
      let hours       = todoList.hours;
      let minutes     = todoList.minutes;
      let deletedTodoId = await searchTodoId(userId, year, month, day, hours, minutes);
      
      UserList.findOneAndDelete({ "_id": { $eq: deletedTodoId } })
        .then((deletedTodoItem) => {  
          console.log("[DBG 340]deletedTodoItem", deletedTodoItem);
          res.status(200).json({
            "ok": true,
            "message": "刪除成功!"
          });
        })
        .catch((e) => {
          console.log("[DBG 347]刪除失敗: ", e);
        });
    }else{
      res.status(403).json({
        "error": true,
        "message": "請先登入，才能刪除待辦事項!"
      });
    }
  }catch(err){
    next(err);
  } 
});

app.get("/*", (req, res) => {
  res.status(404).send("404 Page not found.");
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    "error": true,
    "message": "伺服器內部錯誤。"
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000.");
});



