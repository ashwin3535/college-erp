const mongoose = require('mongoose');
const studentSchema = new mongoose.Schema({
    name: String,
    rollNumber: String,
    course: String,
    email: String,
    mobile: String // Naya field
});
module.exports = mongoose.model('Student', studentSchema);