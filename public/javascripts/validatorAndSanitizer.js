const { body } = require('express-validator');

function toUpperCaseStandalone(text) {
	return text.toUpperCase();
}

function capitalizeFirstLetter(text) {
	const firstLetter = text.slice(0, 1);
	const restOfWord = text.slice(1);
	return firstLetter.toUpperCase() + restOfWord;
}

function validatorAndSanitizer(field, errorMsg) {
	return body(field, errorMsg).trim().isLength({min: 1}).escape();
}

module.exports = { toUpperCaseStandalone, capitalizeFirstLetter, validatorAndSanitizer};