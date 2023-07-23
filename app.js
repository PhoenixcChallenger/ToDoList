const bodyParser = require("body-parser");
const express = require("express");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://admin-kunal:Test123@cluster0.pgpndyi.mongodb.net/toDoList');

const itemsSchema = new mongoose.Schema({
    name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: String,
    items:[itemsSchema]
})

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
    let day = date.getDate();
    const foundItems = await Item.find({});
    if (foundItems.length === 0) {
        try {
            await Item.insertMany(defaultItems);
            console.log("Successfully saved default items to DB.");
        } catch (err) {
            console.log(err);
        }
        res.redirect("/");
    }
    else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
})

app.get("/about", function (req, res) {
    res.render("about");
})

app.post("/", async (req, res) => {
    const itemName = req.body.addItem;
    const listName = req.body.list;

    const item = new Item({name: itemName});

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    }
    else{
        const foundList = await List.findOne({name: listName})
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+listName);
        console.log("Sucessfully saved items to "+ listName+"list");
    }

});

app.post("/delete",async (req,res) =>{
    const checkedId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        await Item.deleteOne({_id:checkedId});
        res.redirect("/");
    }
    else{
        const foundList = await List.findOneAndUpdate({name: listName},{$pull: {items: {_id:checkedId}}})
        try {
            res.redirect("/"+listName);
        } catch (error) {
            console.log(error);
        }
    }
})

app.get("/:paramName",async (req,res) => {
    const customListName = _.capitalize(req.params.paramName);
    const foundList = await List.findOne({name:customListName});
    try {
        if (!foundList) {
            const list = await List.create({
                name: customListName,
                items:defaultItems
            })
            res.redirect("/"+ customListName);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (error) {
        console.log(error);
    }
})

app.listen(3000, function () {
    console.log("Server is running on PORT 3000.");
})