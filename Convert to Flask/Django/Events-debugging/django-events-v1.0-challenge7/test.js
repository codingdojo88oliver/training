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

var user2 = {
    name: "Jackmerius Tacktheritrix",
    email: "jack@tacktheritrix.com",
    password: "password",
    c_password: "password",  
};

// is just user2 login creds
var user2a = {
    email: "jack@tacktheritrix.com",
    password: "password"
};

var event = {
    name: "Albert Einstein",
    date: "2019-12-1",
    location: "Philippines",
    description: "lorem ipsum something something",
    max_attendees: 2,
}

describe('(1 pt) When the user clicks the ‘Delete’ button, the event should be removed from the events table in the database. Also, the page refreshes and the deleted event should no longer appear on the page.', function(){
    this.timeout(15000);
    before(function() {
        request.get(base_url + '/logout')
        .end(function(err, res){

        })        
        request.get(base_url + '/reset')
        .end(function(err, res){

        })
    });    
    it("When the user clicks the ‘Delete’ button, the event should be removed from the events table in the database. Also, the page refreshes and the deleted event should no longer appear on the page.", function(done){
        request.get(base_url)
        .end(function(err, res){
            var $html = jQuery(res.text);
            user2.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
            request.post(base_url + '/register')
            .type('form')
            .send(user2)
            .then(res => {
                request.get(base_url)
                .end(function(err, res){
                    var $html = jQuery(res.text);
                    user2a.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                    request.post(base_url + '/login')
                    .type('form')
                    .send(user2a)
                    .then(res => {
                        let redirect_url = res != undefined ? res.redirects[0] : "";
                        expect(redirect_url).to.have.string("/dashboard");
                        request.get(base_url + '/host-event')
                        .end(function(err, res){
                            var $html = jQuery(res.text);
                            event.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                            request.post(base_url + '/create-event')
                            .type('form')
                            .send(event)
                            .then(res => {
                                var $html = jQuery(res.text);
                                var delete_event = {};
                                var event_id = $html.find("input.event_id").val();
                                delete_event.csrfmiddlewaretoken = $html.find('input[name=csrfmiddlewaretoken]').val();
                                delete_event.event_id = event_id;
                                request.post(base_url + '/delete-event')
                                .type('form')
                                .send(delete_event)
                                .then(res => {
                                    var $html = jQuery(res.text);
                                    let redirect_url = res != undefined ? res.redirects[0] : "";
                                    expect(redirect_url).to.have.string("/dashboard");
                                    var upcoming_events = $html.find("table#upcoming_events").text();
                                    expect(res.text).to.not.have.string("delete-event");
                                    expect(upcoming_events).to.not.have.string(event.name);
                                    done();
                                })
                                .catch(err =>{
                                    return done(err);
                                })
                            })
                            .catch(err =>{
                                return done(err);
                            });
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
        });                 
    });
});

