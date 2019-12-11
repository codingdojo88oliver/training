from django.conf.urls import url, include
from django.contrib import admin
from main import views

urlpatterns = [
    url(r'^$', views.index),

    url(r'^register$', views.register),

    url(r'^login$', views.login),

    url(r'^dashboard$', views.dashboard),

    url(r'^logout$', views.logout),

    url(r'^mytransactions$', views.myTransactions),

    url(r'^create-product$', views.createProduct),

    url(r'^products/(?P<id>\d+)', views.showProduct),

    url(r'^buy$', views.buy),

    url(r'^negotiate$', views.negotiate),

    url(r'^approve$', views.approve),

    url(r'^dismiss$', views.dismiss),

    url(r'^reset$', views.reset),
]