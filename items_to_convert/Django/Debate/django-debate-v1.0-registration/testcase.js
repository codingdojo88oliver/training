const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
const $ = global.jQuery = require('jquery')(window);
var superagent = require('superagent');
request = superagent.agent();

var chai = require('chai');  
var assert = chai.assert;    // Using Assert style
var expect = chai.expect;    // Using Expect style
var should = chai.should();  // Using Should style

var base_url = "http://localhost:8000";

var user1 = {
    first_name: "Toni",
    last_name: "Spark",
    email: "tspark@revengers.com"
};

var user2 = {
    first_name: "Shore",
    last_name: "Rozenson",
    email: "srozenson@revengers.com"
};
var user3 = {
    first_name: "Darol",
    last_name: "Canvers",
    email: "dcanvers@revengers.com"
};
var user4 = {
    first_name: "Bl",
    last_name: "Node",
    email: "bnode@revengers.com"
};
var user5 = {
    first_name: "Anna",
    last_name: "Gn",
    email: "agn@revengers.com"
};
var user6 = {
    first_name: "Will",
    last_name: "Smit",
    email: "ws@ws.com"
};

describe('(1 pt) Create the user registration feature', function(){
    // all validation errors
    it("should be able to POST to /register", function(done) {

    })
    it("Name should be at least 3 characters", function(done){

    })
    it("Password should be at least 6 characters", function(done){

    })
    it("should have a success message upon successful registration", function(done){

    })
    it("should redirect back to /main page upon successful registration", function(done){

    })
    it("should insert name, email, password, country, interests, and languages to database", function(done){

    })
});
