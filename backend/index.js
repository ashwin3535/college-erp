const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer'); 
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');          
const jwt = require('jsonwebtoken');       
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "nri_super_secret_key_2026";

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, 
    password: { type: String, required: true }, 
    role: { type: String, required: true }, 
    name: String, rollNumber: String, course: String, email: String, mobile: String, department: String
});
const User = mongoose.model('User', userSchema);

const fileSchema = new mongoose.Schema({
    originalName: String, filename: String, category: String, uploadedBy: String, uploadDate: { type: Date, default: Date.now }
});
const FileModel = mongoose.model('File', fileSchema);

// --- MASSIVE DUMMY DATA SEEDER (20 Students & 20 Faculties) ---
const seedDummyData = async () => {
    try {
        const commonPassword = '123456'; // Sabka naya password '123456'
        const hashedPassword = await bcrypt.hash(commonPassword, 10);

        // 1. FORCE DELETE OLD ADMIN & CREATE FRESH ADMIN
        await User.deleteMany({ role: 'ADMIN' }); // Purana bina-security wala admin hamesha ke liye delete
        await new User({ username: 'admin', password: hashedPassword, role: 'ADMIN', name: 'Master Admin' }).save();
        console.log("✅ Fresh Master Admin Created Securely! (Password: 123456)");

        // Check if we need to seed the 40 new records
        const studentCount = await User.countDocuments({ role: 'STUDENT' });
        
        if (studentCount < 20) {
            console.log("🔄 Generating new 20 Faculties and 20 Students...");
            
            // Purana dummy data clean karna taaki duplicate errors na aayein
            await User.deleteMany({ role: { $in: ['FACULTY', 'STUDENT'] } });

            // 20 Faculty Accounts
            const facultyList = [
                { username: 'Dr. Amit Sharma', department: 'Computer Science' },
                { username: 'Prof. Neha Patel', department: 'Information Technology' },
                { username: 'Dr. Rahul Verma', department: 'Mechanical Eng.' },
                { username: 'Prof. Priya Mishra', department: 'Electronics' },
                { username: 'Prof. Sunil Yadav', department: 'Mathematics' },
                { username: 'Dr. Kavita Singh', department: 'Physics' },
                { username: 'Prof. Vikram Rathore', department: 'Civil Eng.' },
                { username: 'Dr. Ananya Desai', department: 'Chemistry' },
                { username: 'Prof. Rajesh Kumar', department: 'Computer Science' },
                { username: 'Dr. Sneha Gupta', department: 'Information Technology' },
                { username: 'Prof. Manish Tiwari', department: 'Mechanical Eng.' },
                { username: 'Dr. Pooja Agarwal', department: 'Electronics' },
                { username: 'Prof. Suresh Joshi', department: 'Civil Eng.' },
                { username: 'Dr. Nidhi Jain', department: 'Computer Science' },
                { username: 'Prof. Ramesh Chandra', department: 'Mathematics' },
                { username: 'Dr. Swati Bhatia', department: 'Physics' },
                { username: 'Prof. Deepak Khanna', department: 'Mechanical Eng.' },
                { username: 'Dr. Ritu Sharma', department: 'Information Technology' },
                { username: 'Prof. Sanjay Singh', department: 'Civil Eng.' },
                { username: 'Dr. Meera Reddy', department: 'Electronics' }
            ].map(f => ({ ...f, password: hashedPassword, role: 'FACULTY', name: f.username }));
            
            await User.insertMany(facultyList);
            console.log("✅ 20 Faculty Accounts Seeded Successfully!");

            // 20 Student Accounts
            const studentList = [
                { name: 'Aakash Sharma', rollNumber: 'NRI26CS001', course: 'B.Tech CS' },
                { name: 'Deepika Lodhi', rollNumber: 'NRI26CS002', course: 'B.Tech CS' },
                { name: 'Gaurav Soni', rollNumber: 'NRI26EC012', course: 'B.Tech EC' },
                { name: 'Kiran Yadav', rollNumber: 'NRI26IT045', course: 'B.Tech IT' },
                { name: 'Rohan Prajapati', rollNumber: 'NRI26ME008', course: 'B.Tech ME' },
                { name: 'Priya Sharma', rollNumber: 'NRI26CS003', course: 'B.Tech CS' },
                { name: 'Aman Verma', rollNumber: 'NRI26IT002', course: 'B.Tech IT' },
                { name: 'Neha Singh', rollNumber: 'NRI26EC005', course: 'B.Tech EC' },
                { name: 'Rahul Kumar', rollNumber: 'NRI26CE001', course: 'B.Tech Civil' },
                { name: 'Sneha Patel', rollNumber: 'NRI26CS004', course: 'B.Tech CS' },
                { name: 'Vikas Tiwari', rollNumber: 'NRI26ME010', course: 'B.Tech ME' },
                { name: 'Pooja Gupta', rollNumber: 'NRI26IT012', course: 'B.Tech IT' },
                { name: 'Sachin Jain', rollNumber: 'NRI26CS005', course: 'B.Tech CS' },
                { name: 'Anjali Desai', rollNumber: 'NRI26EC008', course: 'B.Tech EC' },
                { name: 'Rajesh Singh', rollNumber: 'NRI26CE005', course: 'B.Tech Civil' },
                { name: 'Kavita Agarwal', rollNumber: 'NRI26CS006', course: 'B.Tech CS' },
                { name: 'Manish Sharma', rollNumber: 'NRI26ME015', course: 'B.Tech ME' },
                { name: 'Swati Joshi', rollNumber: 'NRI26IT020', course: 'B.Tech IT' },
                { name: 'Deepak Rathore', rollNumber: 'NRI26EC015', course: 'B.Tech EC' },
                { name: 'Ritu Khanna', rollNumber: 'NRI26CS007', course: 'B.Tech CS' }
            ].map((s, index) => ({ 
                ...s, 
                username: s.name, 
                password: hashedPassword, 
                role: 'STUDENT', 
                email: `${s.name.split(' ')[0].toLowerCase()}@nri.edu`, 
                mobile: `98765432${(index + 10).toString().padStart(2, '0')}` 
            }));

            await User.insertMany(studentList);
            console.log("✅ 20 Student Accounts Seeded Successfully!");
        }

    } catch (err) {
        console.log("⚠️ Seeding Error:", err.message);
    }
};

// Database Connection
mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/collegeERP').then(() => {
    console.log("✅ MongoDB Connected Successfully");
    seedDummyData(); 
}).catch(err => console.log(err));

// --- API ROUTES ---

app.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const user = await User.findOne({ username, role });
        if (!user) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
            res.json({ success: true, token, user: { _id: user._id, name: user.name || user.username, role: user.role, username: user.username } });
        } else {
            res.status(401).json({ success: false, message: "Invalid Credentials" });
        }
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/add-faculty', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await new User({ ...req.body, password: hashedPassword, role: 'FACULTY', name: req.body.username }).save();
        res.json({ success: true, message: "Faculty Added" });
    } catch (err) { res.status(400).json({ error: "Username exists!" }); }
});

app.post('/add-student', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        await new User({ ...req.body, username: req.body.name, password: hashedPassword, role: 'STUDENT' }).save();
        res.json({ success: true });
    } catch (err) { res.status(400).json({ error: "Name already exists!" }); }
});

app.get('/get-faculties', async (req, res) => res.json(await User.find({ role: 'FACULTY' })));

app.get('/get-students', async (req, res) => {
    const { role, username } = req.query;
    if (role === 'STUDENT') res.json(await User.find({ username: username, role: 'STUDENT' }));
    else res.json(await User.find({ role: 'STUDENT' }));
});

app.put('/update-user/:id', async (req, res) => {
    try {
        let updateData = { ...req.body };
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        await User.findByIdAndUpdate(req.params.id, updateData);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/delete-user/:id', async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        await new FileModel({ originalName: req.file.originalname, filename: req.file.filename, category: req.body.category, uploadedBy: req.body.uploadedBy }).save();
        res.json({ success: true, message: "File successfully uploaded!" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/get-files', async (req, res) => res.json(await FileModel.find().sort({ uploadDate: -1 })));

app.delete('/delete-file/:id', async (req, res) => {
    try {
        const file = await FileModel.findById(req.params.id);
        if (file) {
            const filePath = path.join(__dirname, 'uploads', file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            await FileModel.findByIdAndDelete(req.params.id);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, () => console.log("🚀 Server is running on port 5000"));