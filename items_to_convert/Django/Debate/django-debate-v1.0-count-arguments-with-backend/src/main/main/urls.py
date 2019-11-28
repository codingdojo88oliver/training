from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^login$', views.login),

    url(r'^dashboard$', views.dashboard),

    url(r'^create-topic$', views.createTopic),

    url(r'^create-argument$', views.createArgument),

    url(r'^upvote$', views.upvote),

    url(r'^downvote$', views.downvote),

    url(r'^topics/(?P<id>\d+)', views.showTopic),

    url(r'^logout$', views.logout),

    url(r'^reset$', views.reset),
]