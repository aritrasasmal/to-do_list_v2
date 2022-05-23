import express from "express";
import ejs from "ejs";
import mongoose from "mongoose";

const app = express();
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

main().catch(err => console.log(err));
async function main(){
    await mongoose.connect("mongodb+srv://MONGODB_URL/todolistDB");
}

const itemSchema = new mongoose.Schema({
    todo: String
});

const customListSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

const Item = mongoose.model('listitem',itemSchema);

const Customlist = mongoose.model('CustomList', customListSchema);

const item1 = new Item({todo: 'Welcome to your Todolist'});
//item1.save();
const item2 = new Item({todo: 'Hit + to add new item'});
const item3 = new Item({todo: '⬅ Check the box to delete!'});

let itemArray = [item1, item2, item3];


app.get("/", function(req,res){
    
    let today = new Date();
    let str = (today.toLocaleDateString("en-US", {weekday: 'long', month: 'long', day: 'numeric'}));
    console.log("-----------------------");
    Item.find({}, function(err, items){
        if (items.length === 0){
            Item.insertMany(itemArray, function(err){
                if(err) console.log(err);
                else console.log("Item added into db");
            })
        }
        res.render('index', {listTitle: "today", listItems: items});
    })
})

app.get("/:newlistname", (req, res) =>{
    const newListName = req.params.newlistname.toLocaleLowerCase();
    Customlist.findOne({name: req.params.newlistname}, (err, foundList)=>{
        if (foundList===null){
            const newList = new Customlist({
                name: req.params.newlistname,
                items: itemArray
            });
            newList.save();
            res.redirect("/"+ newListName);
        }
        else{
            res.render('index', {listTitle: foundList.name, listItems: foundList.items, listId: foundList._id});
        }
    });
})

app.post("/", function(req, res){
    const listName = req.body.button.toLowerCase();
    const newItem = new Item({ todo: req.body.listInput});
    
    if (listName == 'today'){     
        newItem.save();
        res.redirect("/");
    }
    else{
        Customlist.findOne({name: listName}, (err, foundList)=>{
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/"+listName);
        })  
    }
})

app.post("/delete", function(req, res){
    const listName = req.body.listName;
    const checkboxId = req.body.checkbox;
    if (listName == "Today"){
        Item.deleteOne({_id: checkboxId}, function(err){
            if(err) console.log(err);
            else console.log("Item deleted");
        });
        res.redirect("/");
    }
    else{
        Customlist.updateOne({name: listName}, {$pull: {items: {_id: checkboxId}}}, (err, foundList)=>{
            if (!err) res.redirect("/"+listName);
        })
    }
})

// app.post("/:customlistname", (req, res) =>{
//     const customListName = req.params.customlistname.toLocaleLowerCase();
//     if (customListName != 'delete'){
//     console.log(customListName);
    
//     res.redirect("/"+customListName);
//     }
// })

app.listen(3000, function(){
    console.log("Server is running on port 3000");
})