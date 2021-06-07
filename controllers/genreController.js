var async = require('async');

var Book = require('../models/book');
var Genre = require('../models/genre');

const { body, validationResult } = require('express-validator');

exports.genre_list = function(req, res, next) {
	Genre.find()
		.populate()
		.exec(function (err, list_genres) {
			if (err) { return next(err); }
			res.render('genre_list', {title: 'Genre List', genre_list: list_genres});
		});
};

exports.genre_detail = function(req, res, next) {
	async.parallel({
		genre: function(callback) {
			Genre.findById(req.params.id)
				.exec(callback);
		},
		genre_books: function(callback) {
			Book.find({'genre': req.params.id})
				.exec(callback);
		}
	}, function(err, results) {
		if (err) { return next(err); }
		if (results.genre==null) {
			var err = new Error('Genre not found');
			err.status = 404;
			return next(err);
		}
		
		res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
	});
};

exports.genre_create_get = function(req, res, next) {
	res.render('genre_form', {title: 'Create Genre'});
};

exports.genre_create_post = [
	body('name', 'Genre name required').trim().isLength({min:1}).escape(),
	
	(req, res, next) => {
		const errors = validationResult(req);
		
		var genre = new Genre(
			{name: req.body.name}
		);
		
		if (!errors.isEmpty()) {
			const context = {
				title: 'Create genre',
				genre: genre,
				errors: errors.array()
			};
			res.render('genre_form', context);
			return;
		} else {
			Genre.findOne({'name': req.body.name})
				.exec(function(err, found_genre) {
					if (err) { return next(err); }

					if (found_genre) {
						res.redirect(found_genre.url);
					} else {
						genre.save(function (err) {
							if (err) { return next(err); }
							res.redirect(genre.url);
						});
					}
				});
		}
	}
];

exports.genre_delete_get = function(req, res, next) {
	async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },	
        books: function(callback) {
            Book.find({'genre': req.params.id}).populate('author').exec(callback);
        },       
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        
        const context = {
            title: 'Delete Genre',
			genre: results.genre,
            books: results.books
        };
        res.render('genre_delete', context);
    });
};

exports.genre_delete_post = function(req, res, next) {
	async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback);
        },	
        books: function(callback) {
            Book.find({'genre': req.params.id}).populate('author').exec(callback);
        },   
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.books.length > 0) {
			const context = {
				title: 'Delete Genre',
				genre: results.genre,
				books: results.books
			};
            res.render('genre_delete', context);   
            return;
        } else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/genres');
            });
        }
    });
};

exports.genre_update_get = function(req, res, next) {
	Genre.findById(req.params.id)
		.exec(function (err, genre_to_be_updated) {
			if (err) { return next(err); }		
			
			const context = {
				title: 'Update Genre',
				genre: genre_to_be_updated
				
			};
			res.render('genre_form', context);
		});
};

exports.genre_update_post = [
	body('name', 'Genre name required').trim().isLength({min:1}).escape(),
	
	(req, res, next) => {
		const errors = validationResult(req);
		
		var genre = new Genre(
			{
				name: req.body.name,
				_id: req.params.id	
			}
		);
		
		if (!errors.isEmpty()) {
			const context = {
				title: 'Update genre',
				genre: genre,
				errors: errors.array()
			};
			res.render('genre_form', context);
			return;
		} else {
			Genre.findOne({'name': req.body.name})
				.exec(function(err, found_genre) {
					if (err) { return next(err); }

					if (found_genre) {
						res.redirect(found_genre.url);
					} else {
						Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
							if (err) { return next(err); }
							res.redirect(thegenre.url);
						});
					}
				});
		}
	}
];
