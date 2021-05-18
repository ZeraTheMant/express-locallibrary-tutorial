var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');

const { toUpperCaseStandalone, capitalizeFirstLetter, validatorAndSanitizer } = require('../public/javascripts/validatorAndSanitizer');
const { body, validationResult } = require('express-validator');

var BookInstance = require('../models/bookinstance');

var async = require('async');


exports.index = function(req, res) {
	async.parallel({
		book_count: function(callback) {
			Book.countDocuments({}, callback);
		},
		book_instance_count: function(callback) {
			BookInstance.countDocuments({}, callback);
		},
		book_instance_available_count: function(callback) {
			BookInstance.countDocuments({status: 'Available'}, callback);
		},
		author_count: function(callback) {
			Author.countDocuments({}, callback);
		},
		genre_count: function(callback) {
			Genre.countDocuments({}, callback);
		}
	}, function(err, results) {
		res.render('index', {title: 'Local Library Home', error: err, data: results});
	});
}

exports.book_list = function(req, res, next) {
	Book.find({}, 'title author')
		.populate('author')
		.exec(function (err, list_books) {
			if (err) { return next(err); }
			res.render('book_list', {title: 'Book List', book_list: list_books});
		});
};

exports.book_detail = function(req, res, next) {
	async.parallel({
		book: function(callback) {
			Book.findById(req.params.id)
				.populate('author')
				.populate('genre')
				.exec(callback);
		},
		book_instance: function(callback) {
			BookInstance.find({'book': req.params.id})
				.exec(callback);
		}
	}, function(err, results) {
		if (err) { return next(err); }
		if (results.book==null) {
			var err = new Error('Book not found');
			err.status = 404;
			return next(err);
		}
		
		const context = {
			title: results.book.title,
			book: results.book,
			book_instances: results.book_instance
		};
		
		res.render('book_detail', context);
	});
};

exports.book_create_get = function(req, res, next) {
	async.parallel({
		authors: function(callback) {
			Author.find(callback);
		},
		genres: function(callback) {
			Genre.find(callback);
		}
	}, function(err, results) {
		if (err) { return next(err); }
		const context = {
			title: 'Create Book',
			authors: results.authors,
			genres: results.genres
		};
		res.render('book_form', context);
	});
};

exports.book_create_post = [
	(req, res, next) => {
		if(!(req.body.genre instanceof Array)) {
			if(typeof req.body.genre === 'undefined')
				req.body.genre = [];
			else
				req.body.genre = new Array(req.body.genre);
		}
		next();
	},
	

	validatorAndSanitizer('title', capitalizeFirstLetter('title') + ' must not be empty.'),
	validatorAndSanitizer('author', capitalizeFirstLetter('author') + ' must not be empty.'),
	validatorAndSanitizer('summary', capitalizeFirstLetter('summary') + ' must not be empty.'),
	validatorAndSanitizer('isbn', toUpperCaseStandalone('isbn') + ' must not be empty.'),
	body('genre.*').escape(),
	
	(req, res, next) => {
		const errors = validationResult(req);
		
		var book = new Book(
			{
				title: req.body.title,
				author: req.body.author,
				summary: req.body.summary,
				isbn: req.body.isbn,
				genre: req.body.genre
			}
		);
		
		if (!errors.isEmpty()) {
			async.parallel({
				authors: function(callback) {
					Author.find(callback);
				},
				genres: function(callback) {
					Genre.find(callback);
				}
			}, function(err, results) {
				if (err) { return next(err); }
				
				for (let i=0; i<results.genres.length; i++) {
					if (book.genre.indexOf(results.genres[i]._id) > -1) {
						results.genres[i].checked = 'true';
					}
				}
				
				const context = {
					title: 'Create Book',
					authors: results.authors,
					genres: results.genres,
					book: book,
					errors: errors.array()
				};
				res.render('book_form', context);
			});
			return;
		} else {
			book.save(function (err) {
				if (err) { return next(err); }
				res.redirect(book.url);
			});
		}
	}
];

exports.book_delete_get = function(req, res, next) {
	async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback);
        },
        author: function(callback) {
            /*Book.findById(req.params.id).then(function(doc) {
                Author.findById(doc.author._id).exec(callback);
            });*/  
			Book.findById(req.params.id).populate('author').exec(callback);	
        },
        book_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        }        
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) {
            res.redirect('/catalog/books');
        }
        
        const context = {
            title: 'Delete Book',
            book: results.book,
            author: results.author,
            book_instances: results.book_instances
        };
        res.render('book_delete', context);
    });
};

exports.book_delete_post = function(req, res, next) {
	async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback);
        },
        author: function(callback) {
			Book.findById(req.params.id).populate('author').exec(callback);	            
        },
        book_instances: function(callback) {
            BookInstance.find({'book': req.params.id}).exec(callback);
        } 
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book_instances.length > 0) {
			const context = {
				title: 'Delete Book',
				book: results.book,
				author: results.author,
				book_instances: results.book_instances
			};
            res.render('book_delete', context);   
            return;
        } else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/books');
            });
        }
    });
};

exports.book_update_get = function(req, res, next) {
	async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        }
    }, function(err, results) {
        if (err) { return next(err); }
        
        if (results.book==null) {
            const err = new Error('Book not found.');
            err.status = 404;
            return next(err);
        }
        
        for (var all_g_iter=0; all_g_iter<results.genres.length; all_g_iter++) {
            for (var book_g_iter=0; book_g_iter<results.book.genre.length; book_g_iter++) {
                if (results.genres[all_g_iter]._id.toString()===results.book.genre[book_g_iter]._id.toString()) {
                    results.genres[all_g_iter].checked = 'true';
                }
            }
        }
        
        const context = {
            title: 'Update Book',
            authors: results.authors,
            genres: results.genres,
            book: results.book
        };
        res.render('book_form', context);
    });
};

exports.book_update_post = [
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)) {
            if(typeof req.body.genre==='undefined')
                req.body.genre = [];
            else
                req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    
	validatorAndSanitizer('title', capitalizeFirstLetter('title') + ' must not be empty.'),
	validatorAndSanitizer('author', capitalizeFirstLetter('author') + ' must not be empty.'),
	validatorAndSanitizer('summary', capitalizeFirstLetter('summary') + ' must not be empty.'),
	validatorAndSanitizer('isbn', toUpperCaseStandalone('isbn') + ' must not be empty.'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        
        var book = new Book(
            {
                title: req.body.title,
                author: req.body.author,
                summary: req.body.summary,
                isbn: req.body.isbn,
                genre: (typeof req.body.genre === 'undefined') ? [] : req.body.genre,
                _id: req.params.id
            }
        );
        
        if (!errors.isEmpty()) {
            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                }
            }, function(err, results) {
                if (err) { return next(err); }
                
                for (let i=0; i<result.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked = 'true';
                    }
                }
                
                const context = {
                    title: 'Update Book',
                    authors: results.authors,
                    genres: results.genres,
                    book: book,
                    errors: errors.array()
                };
                res.render('book_form', context)
            });
            return;
        } else {
            Book.findByIdAndUpdate(req.params.id, book, {}, function(err, thebook) {
                if (err) { return next(err); }

                res.redirect(thebook.url);
            });                                
        }      
    }
];