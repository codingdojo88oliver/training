from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^login$', views.login),

    url(r'^dashboard$', views.dashboard),

    url(r'^logout$', views.logout),

    url(r'^create-quote$', views.createQuote),

    url(r'^move-to-favorites$', views.moveToFavorites),

    url(r'^remove-from-favorites$', views.removeFromFavorites),

    url(r'^delete-quote$', views.deleteQuote),

    url(r'^reset$', views.reset),
]