var casper = require("casper").create({
    pageSettings: {
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:23.0) Gecko/20130404 Firefox/23.0"
    },    
    verbose: true,
    logLevel: 'debug'

});

var fs = require('fs');
var utils = require('utils');

casper.options.waitTimeout = 10000; 

var stepIndex = 0, url = "https://www.amazon.com/gp/css/order-history?ie=UTF8&ref_=nav_youraccount_orders&";
var currentPage = 1;
var orders = [];
var user = '', pass = '';
var currentLink = 1;
var config = {};
var orderLinks = [];
var data = [];
// load config

configFile = fs.read('config.json');
config = JSON.parse(configFile);

user = config.email;
pass = config.pass;

function processPage() {
  
    //currentLink = 1;
    this.capture('screenshots/page'+ currentPage++ +'.png');
    
    
    processDetails();
    
    if(!this.exists("ul.a-pagination li.a-last a") || currentPage > 2)
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
}

function fetchData()
{
    var current = 0;
    var end = orderLinks.length;
    var tmpCSV = "";
    var f = fs.open("orders_" + config.email.replace("@", "-") + ".csv", "aw");
    var csvHeaders = "Full Name, Products, Subtotal, Shipping and Handling, Before Tax, Estimated Tax, Total, Date";
    f.writeLine(csvHeaders);
    f.close();
    
    for(;current < end;)
    {
      
       casper.thenOpen(orderLinks[current], function() {
                //this.capture('screenshots/order-details' + current +'.png');
                data = this.evaluate(function() {
                    
                    var productTitles = document.querySelectorAll(".shipment .a-box-inner .a-fixed-left-grid-inner .a-col-right a");
                    productTitlesConcat = "";
                    for( i = 0; i < productTitles.length; i++ )
                    {
                        productTitlesConcat = productTitles[i].textContent.trim();
                        if(productTitles.length > 1)
                        {
                            productTitlesConcat = productTitlesConcat.concat("|", productTitlesConcat);
                        }
                        
                    }
                    
                    /*
                   return {
                        fullName:     document.querySelector(".displayAddressDiv .displayAddressFullName").textContent,
                        subtotal:     document.querySelector("#od-subtotals > div:nth-child(2) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                        shipping:     document.querySelector("#od-subtotals > div:nth-child(3) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                        beforeTax:    document.querySelector("#od-subtotals > div:nth-child(5) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                        estimatedTax: document.querySelector("#od-subtotals > div:nth-child(6) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                        total:        document.querySelector("#od-subtotals > div:nth-child(8) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                        date:         new Date(document.querySelector("#orderDetails > div:nth-child(4) > div.a-column.a-span9.a-spacing-top-mini > div > span:nth-child(1)").textContent.replace("Ordered on", "")),
                        products:     productTitlesConcat

                   } */
                   return [
                         document.querySelector(".displayAddressDiv .displayAddressFullName").textContent,
                         productTitlesConcat,
                         document.querySelector("#od-subtotals > div:nth-child(2) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                         document.querySelector("#od-subtotals > div:nth-child(3) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                         document.querySelector("#od-subtotals > div:nth-child(5) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                         document.querySelector("#od-subtotals > div:nth-child(6) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                         document.querySelector("#od-subtotals > div:nth-child(8) > div.a-column.a-span4.a-text-right.a-span-last > span").textContent.trim().replace("$", ""),
                         document.querySelector("#orderDetails > div:nth-child(4) > div.a-column.a-span9.a-spacing-top-mini > div > span:nth-child(1)").textContent.replace("Ordered on", "").trim()
                        ]
                   
                });
                
                utils.dump(data.join());
                
                tmpCSV = data.join();
                var f = fs.open("orders_" + config.email.replace("@", "-") + ".csv", "aw");
                f.writeLine(tmpCSV);
                f.close();    
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
    
    this.capture('screenshots/login.png');
});


casper.waitForSelector('ul.a-pagination li.a-last a', processPage, terminate)
 
 
casper.run();