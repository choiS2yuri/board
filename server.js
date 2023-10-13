const express = require('express');
//require - 무언가(괄호안에있는거)를 불러오겠다
const app = express();
//국룰로 쓰는거라서 그냥 복사붙여넣기
//const port = 5000

const dotenv= require('dotenv');
dotenv.config();

app.set('view engine', 'ejs');


const {MongoClient, ObjectId} = require('mongodb');
app.use(express.static(__dirname + '/public'))

let db;
let sample; //샘플한개 더 본다면 변수설정해줘야함
const url= `mongodb+srv://${process.env.MONGODB_ID}:${process.env.MONGODB_PW}@cluster0.kbf0eqe.mongodb.net/`

new MongoClient(url).connect().then((client)=>{
    db= client.db("board")
    sample = client.db("sample_training")
    console.log("DB연결완료!!")
    app.listen(process.env.SERVER_PORT, ()=>{
        console.log(`${process.env.SERVER_PORT}번호에서 서버 실행` )
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

    const result = await db.collection("notice").find().toArray()
//한개가져오는거는 findOne()으로 가져오기 find는 전체문서를 가져오는거
    console.log(result[0])
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
    console.log(result)
    res.render("view.ejs",{
        data : result
    })
})

app.get('/portfolio', (req,res)=>{
    res.send("포폴페이지2");
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
