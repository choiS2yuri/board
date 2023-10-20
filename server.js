const express = require('express');
//require - 무언가(괄호안에있는거)를 불러오겠다
const app = express();
//국룰로 쓰는거라서 그냥 복사붙여넣기
//const port = 5000

const dotenv= require('dotenv');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
//이렇게 셋팅하면 password가려짐
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MongoStore = require('connect-mongo');

dotenv.config();
app.use(passport.initialize());
app.use(session({
    secret: '암호화에쓸비번',
    //세션 문서의 암호화
    resave: false,
    //유저가 서버로 요청할때 마다 갱신할건지
    saveUninitialized: false,
    //로그인안해도 세션 만들건지
    cookie: {maxAge: 60 * 60 * 1000},
    //1시간동안 쿠키가 저장되어있음
    store: MongoStore.create({
        mongoUrl: `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.kbf0eqe.mongodb.net/`,
        dbName: "board"
    })
}))
app.use(passport.session());
app.use(methodOverride('_method'));

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.set('view engine', 'ejs');


const {MongoClient, ObjectId} = require('mongodb');
app.use(express.static(__dirname + '/public'))

let db;
let sample; //샘플한개 더 본다면 변수설정해줘야함
const url= `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.kbf0eqe.mongodb.net/`

new MongoClient(url).connect().then((client)=>{
    db= client.db("board")
    sample = client.db("sample_training")
    // console.log("DB연결완료!!")
    app.listen(process.env.SERVER_PORT, ()=>{
        // console.log(`${process.env.SERVER_PORT}번호에서 서버 실행` )
        // console.log(`${port}번호에서 서버실행중`)
    })
    //서버를 여는 방식으로 복붙
}).catch((error)=>{
    console.log(error)
})


app.get('/',(req,res)=>{
    // res.send("Hello World");
    res.sendFile(__dirname + '/page/index.html')
})
// 이제 yarn start - react처럼 자동으로 열리는것과 달리 구글창 열어서 localhost:5000으로 직접들어가야함

app.get('/about',(req,res)=>{
    // res.send("About 페이지");
    res.sendFile(__dirname + "/page/about.html")
    // db.collection("notice").insertOne({
    //     title:"첫번째글",
    //     content: "두번째글"
    // })
})

app.get('/list',async (req,res)=>{

    const result = await db.collection("notice").find().limit(5).toArray()
//한개가져오는거는 findOne()으로 가져오기 find는 전체문서를 가져오는거
    // console.log(result[0])
    res.render("list.ejs",{
        data : result
    });
});
app.get('/list/:id', async (req,res)=>{
//:id는 작명이며 :뒤에는 뭐든 붙을 수 있다
    const result = await db.collection("notice").find().skip((req.params.id -1) * 5).limit(5).toArray()
    // console.log(result[0])
    res.render("list.ejs",{
        data : result
    });
});

app.get('/test',(req,res)=>{
    res.send("테스트 페이지");
})
app.get('/view/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id :new ObjectId(req.params.id)
    })
    // console.log(result)
    res.render("view.ejs",{
        data : result
    })
})
app.get('/write', (req,res)=>{
    res.render("write.ejs");
})
app.get('/portfolio', (req,res)=>{
    res.send("포폴페이지2");
})


app.post('/add', async (req, res)=>{
    // console.log(req.body)
    try{

        await db.collection("notice").insertOne({
            title: req.body.title,
            content: req.body.content
        }) 
    }catch(error){
        console.log(error)
    }
    // res.send("성공!")
    res.redirect('/list')
})

app.put('/edit', async (req,res)=>{
    //updataeOne({문서},(
    // $set : {원하는 키: 변경값}
    //))
    // console.log(req.body)
    await db.collection("notice").updateOne({
        _id: new ObjectId(req.body._id)
    }, {
        $set: {
            title: req.body.title,
            content: req.body.content
        }
    })
    const result = "";
    // res.send(result)
    res.redirect('/list')
})

// app.get('/delete/:id', async (req,res)=>{
//     try{
//         await db.collection("notice").deleteOne({
//             _id: new ObjectId(req.params.id)
//         })
//         const result = "";
//     }catch(error){
//         console.log(error)
//     }
//     // res.send(result)
//     res.redirect('/list')
// })
app.get('/delete/:id', async (req,res)=>{
    //어떤값이 넘어올지 모르니깐 :id로 적어줌
    // res.send("삭제")
    // 화면에 출력됨
    await db.collection("notice").deleteOne({
        _id :new ObjectId(req.params.id)
    })
    //에디터는 어떤 데이터를 받아서 출력하기 때문에 resuly값이 필요했는데
    //삭제는 그냥 지우기되기때문에 result값이 필요없음 
    res.redirect("/list")
})


app.get('/edit/:id', async (req,res)=>{
    const result = await db.collection("notice").findOne({
        _id :new ObjectId(req.params.id)
    })
    res.render('edit.ejs', {
        data: result
    })
})

passport.use(new LocalStrategy({
    usernameField:'userid',
    passwordField: 'password'
}, async (userid,password,cb)=>{

    let result = await db.collection("users").findOne({
        userid : userid
    })
    

    if(!result){
        //정보가 일치하지 않거나 없다면
        return cb(null, false, {Message: '아이디나 비밀번호가 일치 하지 않음'})
        //cb는 미들웨어:도중에 실행하는거
        //그래서 로그인전에 passport를 써줘야함
    }
    const passChk = await bcrypt.compare(password, result.password);
    console.log(passChk)
    if(passChk){
        return cb(null, result);
    }else{
        return cb(null, false, {Message: '아이디나 비밀번호가 일치 하지 않음'})
    }
}))

passport.serializeUser((user,done)=>{
    process.nextTick(()=>{
        //비동기적으로 움직이는 함수 (자바스크립트함수)
        // done(null, 세션에 기록할 내용)
        done(null, {id: user._id, userid: user.userid})
        //user라는 폴더안에 ._id
    })
})

passport.deserializeUser(async (user,done)=>{
    let result = await db.collection("users").findOne({
        _id: new ObjectId(user.id)
    })
    delete result.password
    // console.log(result)
    process.nextTick(()=>{
        done(null, result);
    })
})



app.get('/login', (req,res)=>{
    res.render('login.ejs')
})
app.post('/login', async(req,res,next)=>{
    console.log(req.body);
    passport.authenticate('local', (error, user, info)=>{
        console.log(error,user,info)
        if(error) return res.status(500).json(error);
        if(!user) return res.status(401).json(info.message);
        req.logIn(user, (error)=>{
            if(error) return next(error);
            res.redirect('/')
        })
    })(req,res,next)
})




app.get('/register', (req,res)=>{
    res.render("register.ejs")
})

app.post('/register', async(req,res)=>{
    let hashPass = await bcrypt.hash(req.body.password, 10);
    //10정도 적으면 10번 꼬아서 안보이도록함
    console.log(hashPass)

    try{

        await db.collection("users").insertOne({
            userid: req.body.userid,
            password: hashPass
        }) 
    }catch(error){
        console.log(error)
    }
    res.redirect("/list")
})

//1.Uniform Interface
//여러 URL 과 METHOD 는 일관성이 있어야 하며, 하나의 URL에서는 하나의 데이터만 가져오게 디자인하며, 간결하고 예측 가능한 URL과 METHOD를 만들어야한다.
//동사보다는 명사위주
//띄어쓰기는 언더바 대신 대시기호
//파일 확장자는 사용금지
//하위문서를 뜻할땐 / 기호를 사용

//2.클라이언트와 서버역할 구분
//유저에게 서버 역할을 맡기거나 직접 입출력을 시키면 안된다.
//3.stateless
//요청들은 서로 의존성이 있으면 안되고, 각각 독립적으로 처리되어야 한다.
//4.Cacheable
//서버가 보내는 자료는 캐싱이 가능해야 한다 - 대부분 컴퓨터가 동작
//5.layered System
//서버 기능을 만들 때 레이어를 걸쳐서 코드가 실행되어야 한다.(몰라도됨)
//6.Code on Demeand]
//서버는 실행 가능한 코드를 보낼 수 있다 (몰라도됨)
