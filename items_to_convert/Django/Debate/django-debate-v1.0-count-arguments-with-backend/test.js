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

describe('(1 pt) When a user added an Argument for a particular topic, the count of Arguments for this Topic should be increased by 1.', function(){
    before(function(done) {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
        this.timeout(30000);
        // register 2 default users:
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user3.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user3)
            .then(res => {

            })
            .catch(err =>{
                return done(err);
            })
        });
        this.timeout(30000);
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                done();
            })
            .catch(err =>{
                return done(err);
            })
        });   


    });
    this.timeout(30000);
    it("When a user added an Argument for a particular topic, the count of Arguments for this Topic should be increased by 1.", function(done){
        request.get(base_url)
        .end(function(err, res){
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
                        request.get(base_url)
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            user6.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            request.post(base_url + '/login')
                            .type('form')
                            .send(user6)
                            .then(res => {
                                let redirect_url = res != undefined ? res.redirects[0] : "";
                                expect(redirect_url).to.have.string("/dashboard");
                                var $html = jQuery(res.text);
                                request.get(base_url + "/topics/1")
                                .end(function(err, res){
                                    expect(res.text).to.have.string("Topic Title 1");
                                    var $html = jQuery(res.text);
                                    var topic_id = $html.find('input[name=topic_id]').val();
                                    var argument = {
                                        argument: "I agree because it's true",
                                        stance: "agree",
                                        topic_id: topic_id,
                                    };
                                    argument.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                    request.post(base_url + '/create-argument')
                                    .type('form')
                                    .send(argument)
                                    .then(res => {
                                        request.get(base_url + '/dashboard')
                                        .end(function(err, res){
                                            var $html = jQuery(res.text);
                                            var count = parseInt($html.find('.fresh-count').text());
                                            expect(count).to.equal(1);
                                            done();
                                        });
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
                    })
                    .catch(err =>{
                        return done(err);
                    })
                })
            })
            .catch(err =>{
                return done(err);
            })
        });   
    })    
});

describe('(1 pt) When a user clicked Upvote to a particular Argument, its point should increase by 1.', function(){
    this.timeout(15000);
    it("When a user clicked Upvote to a particular Argument, its point should increase by 1.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                request.get(base_url + "/topics/1")
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var upvote = {};
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument_id = $html.find('input[name=argument_id]').val();
                    upvote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    upvote.topic_id = topic_id;
                    upvote.argument_id = argument_id;
                    request.post(base_url + '/upvote')
                    .type('form')
                    .send(upvote)
                    .then(res => {
                        var $html = jQuery(res.text);
                        var points = $html.find('.agree-points').text();
                        expect(points).to.have.string('1 points');
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                });
            })
            .catch(err =>{
                return done(err);
            })
        });
    });
});

describe('(1 pt) When a user clicked Downvote to a particular Argument, its point should decrease by 1. Having negative point is okay.', function(){
    this.timeout(15000);
    it("When a user clicked Downvote to a particular Argument, its point should decrease by 1. Having negative point is okay.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                request.get(base_url + "/topics/1")
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var upvote = {};
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument_id = $html.find('input[name=argument_id]').val();
                    upvote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    upvote.topic_id = topic_id;
                    upvote.argument_id = argument_id;
                    request.post(base_url + '/downvote')
                    .type('form')
                    .send(upvote)
                    .then(res => {
                        var $html = jQuery(res.text);
                        var points = $html.find('.agree-points').text();
                        expect(points).to.have.string('None points');
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                });
            })
            .catch(err =>{
                return done(err);
            })
        });
    });
});

describe('(1 pt) Upon Upvotes and Downvotes action of the user, the total count of points per Stance under the individual Topic page (/topics/<id>) should also be updated.', function(){
    this.timeout(15000);
    it("Upon Upvotes and Downvotes action of the user, the total count of points per Stance under the individual Topic page (/topics/<id>) should also be updated.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                request.get(base_url + "/topics/1")
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var upvote = {};
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument_id = $html.find('input[name=argument_id]').val();
                    upvote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    upvote.topic_id = topic_id;
                    upvote.argument_id = argument_id;
                    request.post(base_url + '/upvote')
                    .type('form')
                    .send(upvote)
                    .then(res => {
                        var $html = jQuery(res.text);
                        var points = $html.find('.agree-points-total').text();
                        expect(points).to.have.string('Current Points: 1');
                        done();
                    })
                    .catch(err =>{
                        return done(err);
                    })
                });
            })
            .catch(err =>{
                return done(err);
            })
        });
    })
});

describe('(2 pts) Upon Upvotes and Downvotes action of the user, the Leading Stance section on the Dashboard page (/dashboard) should also be updated with the correct computation per Topic.', function(){
    this.timeout(15000);
    it("Upon Upvotes and Downvotes action of the user, the Leading Stance section on the Dashboard page (/dashboard) should also be updated with the correct computation per Topic.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user5.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/login')
            .type('form')
            .send(user5)
            .then(res => {
                var $html = jQuery(res.text);
                request.get(base_url + "/topics/1")
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    var upvote = {};
                    var topic_id = $html.find('input[name=topic_id]').val();
                    var argument_id = $html.find('input[name=argument_id]').val();
                    upvote.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    upvote.topic_id = topic_id;
                    upvote.argument_id = argument_id;
                    request.post(base_url + '/upvote')
                    .type('form')
                    .send(upvote)
                    .then(res => {
                        request.get(base_url + "/dashboard")
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            var my_topics = $html.find('.my-topics').text();
                            expect(my_topics).to.have.string('Agree with 2 points');
                            done();
                        });
                    })
                    .catch(err =>{
                        return done(err);
                    })
                });
            })
            .catch(err =>{
                return done(err);
            })
        });
    });
})