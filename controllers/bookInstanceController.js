const { body, validationResult } = require('express-validator');
const { toUpperCaseStandalone, capitalizeFirstLetter, validatorAndSanitizer } = require('../public/javascripts/validatorAndSanitizer');
var async = require('async');

var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');

exports.bookinstance_list = function(req, res, next) {
	BookInstance.find()
		.populate('book')
		.exec(function (err, list_bookinstances) {
			if (err) { return next(err); }
			res.render('bookinstance_list', {title: 'Book Instance List', bookinstance_list: list_bookinstances});
		});
};

exports.bookinstance_detail = function(req, res, next) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, bookinstance) {
			if (err) { return next(err) };
			if (bookinstance == null) {
				var err = new Error('Book copy not found');
				err.status = 404;
				return next(err);
			}
			
			const context = {
				title: 'Copy of ' + bookinstance.book.title, 
				bookinstance: bookinstance
			}
			
			res.render('bookinstance_detail', context);
		});
};

exports.bookinstance_create_get = function(req, res, next) {
	Book.find({}, 'title')
		.exec(function (err, books) {
			if (err) { return next(err); }		
			
			const context = {
				title: 'Create Book Instance',
				book_list: books
			}
			res.render('bookinstance_form', context);
		});
};

exports.bookinstance_create_post = [
	validatorAndSanitizer('book', capitalizeFirstLetter('book') + ' must be specified.'),
	validatorAndSanitizer('imprint', capitalizeFirstLetter('imprint') + ' must be specified.'),
	body('status').escape(),
	body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
	
	(req, res, next) => {
		const errors = validationResult(req);

		var bookinstance = new BookInstance(
			{
				book: req.body.book,
				imprint: req.body.imprint,
				status: req.body.status,
				due_back: req.body.due_back
			}
		);

		if(!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) { return next(err); }
					
					const context = {
						title: 'Create Book Instance',
						book_list: books,
						selected_book: bookinstance.book_id,
						errors: errors.array(),
						bookinstance: bookinstance
					};
					res.render('bookinstance_form', context);
				});
			return;
		} else {
			bookinstance.save(function (err) {
				if (err) { return next(err); }
				
				res.redirect(bookinstance.url);
			});
		}
	}
];

exports.bookinstance_delete_get = function(req, res, next) {
	BookInstance.findById(req.params.id)
		.populate('book')
		.exec(function (err, book_instance) {
			if (err) { return next(err); }		
			
			const context = {
				title: 'Delete Book Instance',
				book_instance: book_instance
			}
			res.render('bookinstance_delete', context);
		});
};

exports.bookinstance_delete_post = function(req, res, next) {
	BookInstance.findById(req.params.id)
		.exec(function (err, book_instance) {
			if (err) { return next(err); }		
			
			BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deleteBookInstance(err) {
				if (err) { return next(err); }
				res.redirect('/catalog/bookinstances');
			});
		});
};

exports.bookinstance_update_get = function(req, res, next) {
	async.parallel({
        book_list: function(callback) {
            Book.find().exec(callback);
        },
		bookinstance: function(callback) {
			BookInstance.findById(req.params.id).populate('book').exec(callback);
		}
    }, function(err, results) {
        if (err) { return next(err); }
        
        if (results.bookinstance==null) {
            const err = new Error('Book Instance not found.');
            err.status = 404;
            return next(err);
        }       
        
        const context = {
            title: 'Update Book Instance',
            bookinstance: results.bookinstance,
            book_list: results.book_list
        };
        res.render('bookinstance_form', context);
    });
};

exports.bookinstance_update_post = [
	validatorAndSanitizer('book', capitalizeFirstLetter('book') + ' must be specified.'),
	validatorAndSanitizer('imprint', capitalizeFirstLetter('imprint') + ' must be specified.'),
	body('status').escape(),
	body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601().toDate(),
	
	(req, res, next) => {
		const errors = validationResult(req);

		var bookinstance = new BookInstance(
			{
				book: req.body.book,
				imprint: req.body.imprint,
				status: req.body.status,
				due_back: req.body.due_back,
                _id: req.params.id				
			}
		);

		if(!errors.isEmpty()) {
			Book.find({}, 'title')
				.exec(function (err, books) {
					if (err) { return next(err); }
					
					const context = {
						title: 'Update Book Instance',
						book_list: books,
						selected_book: bookinstance.book_id,
						errors: errors.array(),
						bookinstance: bookinstance
					};
					res.render('bookinstance_form', context);
				});
			return;
		} else {
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, thebookinstance) {
                if (err) { return next(err); }

                res.redirect(thebookinstance.url);
            });			
		}
	}
];