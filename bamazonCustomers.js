

//node modules
var mysql = require('mysql');
var express = require('express');
var inquirer = require('inquirer'); // delete this???????????????????

// Create express app instance.
var app = express();

//specify port
var port = 3000;

//sql connection
var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    database: "Bamazon"
});

//global variables
var shoppingCart = [];
var totalCost = 0;

//connect to mysql and then run the main function
connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    printItems(function(){
      userSelectsItem();
    });
});


  // Routes
app.get("/", function(req, res) {

  // Initiate a SQL query to grab all records. //get all rows from the Products table
  // All of the resulting records are stored in the variable "result."
  connection.query("SELECT * FROM Products", function(err, result) {

    // We then begin building out HTML elements for the page.
    var html = "<h1> Bamazon </h1>";

    // Here we begin an unordered list.
    html += "<ul>";

    // We then use the retrieved records from the database to populate our HTML file.
    for (var i = 0; i < result.length; i++) {
      html += "<li><p> ID Number " + result[i].ItemID + "</p>";
      html += "<p> Product Name: " + result[i].ProductName + " </p></li>";
      html += "<p> DepartmentName: " + result[i].DepartmentName + " </p></li>";
      html += "<p> Price: " + result[i].Price + " </p></li>";
      html += "<p> StockQuantity: " + result[i].StockQuantity + " </p></li>";
    }

    // We close our unordered list.
    html += "</ul>";

    // Finally we send the user the HTML file we dynamically created.
    res.send(html);
  });
});

//function to prompt users to add items to their cart
function userSelectsItem(){
  var items = [];
  //get all product names from the Products table
  connection.query('SELECT ProductName FROM Products', function(err, res){
    if (err) throw err;
    //push all product names into the item array
    for (var i = 0; i < res.length; i++) {
      items.push(res[i].ProductName)
    }
    //prompt the user to select items from the items array
    inquirer.prompt([
      {
      name: 'choices',
      type: 'checkbox',
      message: 'Please add Products to cart? Press Space to choose.',
      choices: items
      }
    ]).then(function(user){
        //run the howManyItems function with all of the items the user selected as an argument
        howManyItems(user.choices)
      }
      });
  });
}

//function to prompt the user as to how many of each item they want
function howManyItems(itemNames){
  //set item equal to the first element of the array and remove that element from the array
  var item = itemNames.shift();
  var itemStock;
  var department;
  //query mysql to get the current stock, price, and department of the item
  connection.query('SELECT StockQuantity, Price, DepartmentName FROM Products WHERE ?', {
    ProductName: item
  }, function(err, res){
    if(err) throw err;
    //set stock, price, and department in a variable
    itemStock = res[0].StockQuantity;
    itemCost = res[0].Price;
    department = res[0].DepartmentName;
  });
  //prompt the user to ask how many of the item they would like
  inquirer.prompt([
    {
    name: 'amount',
    type: 'text',
    message: 'How many ' + item + ' would you like to purchase?',
    //validate that the user input is a number and we have that much of the item in stock
    validate: function(str){
        if (parseInt(str) <= itemStock) {
          return true
        } else {
          //if we don't have that much in stock alert the user and ask for input again
          console.log('\nInsufficient quantity! Only ' + itemStock + ' left in stock.');
          return false;
        }
      }
    }
  ]).then(function(user){
    var amount = user.amount;
    //create an object for the item and push it to the shoppingCart
    shoppingCart.push({
      item: item,
      amount: amount,
      itemCost: itemCost,
      itemStock: itemStock,
      department: department,
      total: itemCost * amount
    });
}