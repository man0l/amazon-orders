var casper = require("casper").create({
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    },    
    verbose: true,
    logLevel: 'debug'

});

var fs = require('fs');

casper.options.waitTimeout = 10000; 

var stepIndex = 0, url = "https://www.amazon.com/gp/css/order-history?ie=UTF8&ref_=nav_youraccount_orders&";
var currentPage = 1;
var orders = [];
var user = '', pass = '';
var currentLink = 1;
var config = {};
var orderLinks = [];
// load config

configFile = fs.read('config.json');
config = JSON.parse(configFile);

user = config.email;
pass = config.pass;

function processPage() {
  
    //currentLink = 1;
    this.capture('page'+ currentPage++ +'.png');
    
    
    processDetails();
    
    if(!this.exists("ul.a-pagination li.a-last a") || currentPage > 4)
    {
         fetchData();
         casper.then(function(){
             return terminate.call(casper);
         });
         
    } 
    
    this.then(function() {
        this.click('ul.a-pagination li.a-last a');
        this.waitForSelector('ul.a-pagination', processPage, terminate);
    });
    
}

function processDetails() 
{
   orderLinks = casper.evaluate(getLinks).concat(orderLinks);       
   
   
    /*casper.thenOpen(orderLinks[currentLink].href, function() {
        console.log("------------------ then open ------------------");
        this.echo(this.getTitle());
    });
    */
}

function fetchData()
{
    var current = 0;
    var end = orderLinks.length;
    
    for(;current < end;)
    {
        console.log(current);
        
       casper.thenOpen(orderLinks[current], function(current) {
                this.capture('order-details' + current +'.png');
        });
        current++;
    }
}

function getLinks() {
   var orderLinks = document.querySelectorAll("#ordersContainer .actions a.a-link-normal[href*='order-details']");
   return Array.prototype.map.call(orderLinks, function(element) {
       return element.href;
   });
}


var getSelectedPage = function() {
    var el = document.querySelector("ul[class='a-pagination'] li[class='a-selected'] a").textContent;
    return parseInt(el.textContent);    
}

var terminate = function() {
    this.echo("Exiting..").exit();
};

casper.start(url, function() {
    
    this.fill("form#ap_signin_form", {
        'email': user,
        'password': pass
    }, true);
    
    this.capture('login.png');
});


casper.waitForSelector('ul.a-pagination li.a-last a', processPage, terminate)
 
 
casper.run();