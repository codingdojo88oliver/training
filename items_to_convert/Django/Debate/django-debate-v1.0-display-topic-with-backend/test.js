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

var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};

var user3 = {
    name: "Brian Buckshank",
    email: "brian@datacompass.com",
    password: "password",
    c_password: "password",
}

// is just user2 login creds
var user5 = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

var user6 = {
    email: "brian@datacompass.com",
    password: "password",
}

describe('(1 pt) When the user adds a new Topic, have that topic be displayed under the “Debate Topics I Created”', function(){
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });
    this.timeout(15000);
    it("When the user adds a new Topic, have that topic be displayed under the 'Debate Topics I Created'", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                var $html = jQuery(res.text);
                user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user5)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var topic = {
                            title: "Topic Title 1",
                            description: "Topic Description 1"
                        };
                        topic.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                        request.post(base_url + '/create-topic')
                        .type('form')
                        .send(topic)
                        .then(res => {
                            var $html = jQuery(res.text);
                            var my_topics = $html.find('.my-topics');
                            let redirect_url = res != undefined ? res.redirects[0] : "";
                            expect(redirect_url).to.have.string("/dashboard");
                            expect(my_topics.text()).to.have.string(topic.title);
                            done();
                        })
                        .catch(err =>{
                            return done(err);
                        })
                    })
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err =>{
                return done(err);
            })
        })        
    })    
})

describe('(1 pt) When another user logs in to the Dashboard page, the user should be able to see all the topics created by other users under “Debate Topics Created by Other Users” table.', function(){
    this.timeout(15000);
    it("When another user logs in to the Dashboard page, the user should be able to see all the topics created by other users under “Debate Topics Created by Other Users” table.", function(done) {
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {
                var $html = jQuery(res.text);
                user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                request.post(base_url + '/login')
                .type('form')
                .send(user6)
                .then(res => {
                    request.get(base_url + '/dashboard')
                    .end(function(err, res){
                        var $html = jQuery(res.text);
                        var other_topics = $html.find('.other-topics');
                        expect(other_topics.text()).to.have.string("Topic Title 1");
                        done();
                    })
                })
                .catch(err =>{
                    return done(err);
                })
            })
            .catch(err =>{
                return done(err);
            })
        })
    })    
})

describe('(1 pt) Each topic should have an individual topic page (/topics/<id>) that displays the Topic’s description and creator.', function(){
    this.timeout(15000);
 
//     // currently logged in is user5 or user2a
//     // "Topic Title 1" is user5's first message
    it("Each topic should have an individual topic page (/topics/<id>) that displays the Topic’s description and creator.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                var href = $html.find("a.my-topic").attr('href');
                request.get(base_url + href)
                .end(function(err, res){
                    expect(res.text).to.have.string("Topic Title 1");
                    expect(res.text).to.have.string("Topic Description 1");
                    done();
                })
            })
            .catch(err =>{
                return done(err);
            })
        })        
    })
})

describe('(1 pt) User should not be able to access an individual topic page that has a non-existed topic id.', function(){
    this.timeout(15000);
    it("User should not be able to access an individual topic page that has a non-existed topic id.", function(done){
        request.get(base_url + '/topics/100000')
        .end(function(err, res){
            expect(res.text).to.have.string("Topic not found");
            done();
        })
    })    
})