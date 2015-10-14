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
var user = 'manol.trendafilov+amazon24@gmail.com', pass = 'manol12345';
var currentLink = 1;
var config = {};

// load config

configFile = fs.read('config.json');


function processPage() {
  
    currentLink = 1;
    this.capture('page'+ currentPage++ +'.png');
    
    processDetails();
    
    if(!this.exists("ul.a-pagination li.a-last a"))
    {
         return terminate.call(casper);
    } 
    
    this.then(function() {
        this.click('ul.a-pagination li.a-last a');
        this.waitForSelector('ul.a-pagination', processPage, terminate);
    });
    
}

function processDetails() 
{
    var orderLinks = document.querySelectorAll("#ordersContainer .actions a.a-link-normal[href*='order-details']");
    
    this.start(orderLinks[currentLink], function() {
        this.echo(this.getTitle());
    });
}

function check() 
{    
    if(links[currentLink])
    {
        processDetails(orderLinks[currentLink]);
        currentLink++;    
    }   
    
    this.run(check);
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

casper.then(function() {
  config = JSON.parse(configFile);
});

 
casper.waitForSelector('ul.a-pagination li.a-last a', processPage, terminate)
 
 
casper.run();