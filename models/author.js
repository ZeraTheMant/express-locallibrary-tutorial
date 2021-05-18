const { DateTime } = require("luxon");
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var AuthorSchema = new Schema(
	{
		first_name: {type: String, required: true, maxLength: 100},
		family_name: {type: String, required: true, maxLength: 100},
		date_of_birth: {type: Date},
		date_of_death: {type: Date},
	}
);


AuthorSchema
	.virtual('name')
	.get(function () {
		return this.family_name + ', ' + this.first_name;
});

AuthorSchema
	.virtual('lifespan')
	.get(function () {
		return (this.date_of_death.getYear() - this.date_of_birth.getYear()).toString();
});

AuthorSchema
	.virtual('url')
	.get(function () {
		return '/catalog/author/' + this._id
});
//(#{author.date_of_birth} - #{author.date_of_death});
//DateTime.fromJSDate(this.date_of_birth.getYear()).toFormat('y')
AuthorSchema
	.virtual('lifespan_in_dates')
	.get(function () {
		const dob = (this.date_of_birth) ? DateTime.fromJSDate(this.date_of_birth).toFormat('y') : "";
		const dod = (this.date_of_death) ? DateTime.fromJSDate(this.date_of_death).toFormat('y') : "";
		
		return (dob || dod) ? "(" + dob + " - " + dod + ")" : "";
});

/*AuthorSchema
	.virtual('mdy_date_format')
	.get(function (date_arg) {
		return DateTime.fromJSDate(date_arg).toFormat('y-MM-dd');
	});*/
	
AuthorSchema.methods.mdy_date_format = function(date_arg) {
	return DateTime.fromJSDate(date_arg).toFormat('y-MM-dd');
};

module.exports = mongoose.model('Author', AuthorSchema);