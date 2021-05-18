const { body, validationResult } = require('express-validator');

var async = require('async');
var Author = require('../models/author');
var Book = require('../models/book');

exports.author_list = function(req, res, next) {
	Author.find()
		.sort([['family_name', 'ascending']])
		//.sort(['family_name', 'ascending'])
		.exec(function (err, list_authors) {
			if (err) { return next(err); }
			res.render('author_list', {title: 'Author List', author_list: list_authors});
		});
};

exports.author_detail = function(req, res, next) {
	async.parallel({
		author: function(callback) {
			Author.findById(req.params.id)
				.exec(callback);
		},
		authors_books: function(callback) {
			Book.find({'author': req.params.id}, 'title summary')
				.exec(callback);
		}
	}, function(err, results) {
		if (err) { return next(err); }
		if (results.author==null) {
			var err = new Error('Author not found');
			err.status = 404;
			return next(err);
		}
		
		const context = {
			title: 'Author Detail',
			author: results.author,
			author_books: results.authors_books
		};
		res.render('author_detail', context);
	});
};

exports.author_create_get = function(req, res, next) {
	res.render('author_form', {title: 'Create Author'});
};

exports.author_create_post = [
	body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified.')
		.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified.')
		.isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),		
	body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
	body('date_of_death', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
	
	(req, res, next) => {
		const errors = validationResult(req);
	
		if (!errors.isEmpty()) {
			const context = {
				title: 'Create Author',
				author: req.body,
				errors: errors.array()
			};
			res.render('author_form', context);
			return;
		} else {
			const author = new Author(
				{
					first_name: req.body.first_name,
					family_name: req.body.family_name,
					date_of_birth: req.body.date_of_birth,
					date_of_death: req.body.date_of_death
				}
			);
			
			author.save(function (err) {
				if (err) { return next(err); }
				res.redirect(author.url);
			});
		}
	}
];

exports.author_delete_get = function(req, res, next) {
	async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({'author': req.params.id}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) {
            res.redirect('/catalog/authors');
        }
        
        const context = {
            title: 'Delete Author',
            author: results.author,
            author_books: results.authors_books
        };
        res.render('author_delete', context);
    });
};

exports.author_delete_post = function(req, res, next) {
	async.parallel({
        author: function(callback) {
            Author.findById(req.body.authorid).exec(callback);
        },
        authors_books: function(callback) {
            Book.find({'author': req.body.authorid}).exec(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        
        if (results.authors_books.length > 0) {
            const context = {
                title: 'Delete Author',
                author: results.author,
                author_books: results.authors_books
            };
            res.render('author_delete', context);   
            return;
        } else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/authors');
            });
        }
    });
};

exports.author_update_get = function(req, res) {
	Author.findById(req.params.id)
		.exec(function (err, author_to_be_updated) {
			if (err) { return next(err); }
			
			const context = {
				title: 'Update Author',
				author: author_to_be_updated
			};
			res.render('author_form', context);
		});
};

exports.author_update_post = [
	body('first_name').trim().isLength({min: 1}).escape().withMessage('First name must be specified.')
		.isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
	body('family_name').trim().isLength({min: 1}).escape().withMessage('Family name must be specified.')
		.isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),		
	body('date_of_birth', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
	body('date_of_death', 'Invalid date of birth').optional({checkFalsy: true}).isISO8601().toDate(),
	
	(req, res, next) => {
		const errors = validationResult(req);
	
		if (!errors.isEmpty()) {
			const context = {
				title: 'Update Author',
				author: req.body,
				errors: errors.array()		
			};
			res.render('author_form', context);
			return;
		} else {
			const author = new Author(
				{
					first_name: req.body.first_name,
					family_name: req.body.family_name,
					date_of_birth: req.body.date_of_birth,
					date_of_death: req.body.date_of_death,
					_id: req.params.id	
				}
			);
			
            Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
                if (err) { return next(err); }

                res.redirect(theauthor.url);
            }); 						
		}
	}
];