const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .populate('user')
    .populate('dishes')
    .then((fav) => {
        if (fav === null) {
            fav = new Favorites({
                user: req.user._id,
                dishes: []
            });
        }
        fav.save()
        .then((fav) => {
            Favorites.findById(fav._id)
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            });
        }, (err) => next(err));
    })
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((fav) => {
        if (fav !== null) {
            for (var i = 0; i < req.body.length; i++) {
                if (fav.dishes.indexOf(req.body[i]._id) === -1)
                    fav.dishes.push(req.body[i]._id);
            }
        }
        else {
            fav = new Favorites({
                user: req.user._id,
                dishes: req.body
            })
        }
        fav.save()
        .then((fav) => {
            Favorites.findById(fav._id)
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            });
        }, (err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({ user: req.user._id })
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200) })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((favorites) => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.json({"exist": false, "favorites": favorites});
        }
        else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exist": false, "favorites": favorites});
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.json({"exist": true, "favorites": favorites});
            }
        }
    })
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((fav) => {
        if (fav !== null) {
            if (fav.dishes.indexOf(req.params.dishId) === -1)
                fav.dishes.push({ "_id": req.params.dishId });
        }
        else {
            fav = new Favorites({
                user: req.user._id,
                dishes: [ req.params.dishId ]
            })
        }
        fav.save()
        .then((fav) => {
            Favorites.findById(fav._id)
            .populate('user')
            .populate('dishes')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            });
        }, (err) => next(err));
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({ user: req.user._id })
    .then((fav) => {
        if (fav !== null) {
            if (fav.dishes.indexOf(req.params.dishId) !== -1) {
                fav.dishes.remove(req.params.dishId);
                fav.save()
                .then((fav) => {
                    Favorites.findById(fav._id)
                    .populate('user')
                    .populate('dishes')
                    .then((favorites) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorites);
                    });
                }, (err) => next(err));
            }
            else {
                err = new Error('Dish ' + req.params.dishId + ' not found.');
                err.status = 404;
                return next(err);
            }
        }
        else {
            err = new Error('Favorites of user ' + req.user._id + ' not found.');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = favoriteRouter;