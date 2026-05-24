import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';

// LIVE BACKEND URL ADD KIYA HAI
const API_BASE_URL = 'https://college-erp-backend.onrender.com';

function App() {
  const [user, setUser] = useState(null);
  const [loginData, setLoginData] = useState({ username: '', password: '', role: 'STUDENT' });
  
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]); 
  const [uploadedFiles, setUploadedFiles] = useState([]);
  
  const [searchFaculty, setSearchFaculty] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [searchFile, setSearchFile] = useState('');

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const [fileData, setFileData] = useState(null);
  const [fileCategory, setFileCategory] = useState('Study Material');

  const [studentForm, setStudentForm] = useState({ name: '', rollNumber: '', course: '', email: '', mobile: '', password: '' });
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);

  const [facultyForm, setFacultyForm] = useState({ username: '', password: '', department: '' });
  const [isEditingFaculty, setIsEditingFaculty] = useState(false);
  const [editFacultyId, setEditFacultyId] = useState(null);

  const theme = {
    primary: '#0f172a', primaryLight: '#1e293b', secondary: '#f8fafc', card: '#ffffff',
    textPrimary: '#334155', textSecondary: '#64748b', border: '#e2e8f0',
    buttonBlue: '#0ea5e9', buttonGreen: '#10b981', buttonRed: '#ef4444', buttonYellow: '#f59e0b'
  };

  const inputStyle = { padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '8px', boxSizing: 'border-box', outline: 'none', color: theme.textPrimary, fontSize: '15px', backgroundColor: '#fdfdfd', width: '100%' };
  const searchStyle = { ...inputStyle, marginBottom: '15px', border: `2px solid #cbd5e1`, backgroundColor: '#f1f5f9' };
  const tableHeader = { background: theme.primaryLight, color: '#f8fafc', padding: '14px', textAlign: 'left', fontWeight: '600', letterSpacing: '0.5px' };
  const tableCell = { padding: '14px', borderBottom: `1px solid ${theme.border}`, color: theme.textPrimary };

  // Setup Global Axios Header for JWT Authentication
  useEffect(() => {
    const token = localStorage.getItem('nri_token');
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const studentRes = await axios.get(`${API_BASE_URL}/get-students?role=${user.role}&username=${user.username}`);
      setStudents(studentRes.data);
      const filesRes = await axios.get(`${API_BASE_URL}/get-files`);
      setUploadedFiles(filesRes.data);
      if (user.role === 'ADMIN') {
        const facultyRes = await axios.get(`${API_BASE_URL}/get-faculties`);
        setFaculties(facultyRes.data);
      }
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, loginData);
      if (res.data.success) {
        localStorage.setItem('nri_token', res.data.token); // Save JWT Token
        setUser(res.data.user);
      }
    } catch (err) { alert("Invalid Credentials! Please check your details or Role."); }
  };

  const handleLogout = () => {
    localStorage.removeItem('nri_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null); setStudents([]); setFaculties([]); setUploadedFiles([]); setShowPwdForm(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!newPassword) return alert("Please enter a new password!");
    try {
      await axios.put(`${API_BASE_URL}/update-user/${user._id}`, { password: newPassword });
      alert("Secure Password Updated! Please login again.");
      handleLogout();
    } catch (err) { alert("Error updating password."); }
  };

  // EXPORT TO EXCEL LOGIC
  const exportToExcel = (data, filename) => {
    const safeData = data.map(({ password, _id, __v, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(safeData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Database");
    XLSX.writeFile(wb, `${filename}_Database.xlsx`);
  };

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingFaculty) {
        await axios.put(`${API_BASE_URL}/update-user/${editFacultyId}`, facultyForm);
        setIsEditingFaculty(false); setEditFacultyId(null);
      } else { await axios.post(`${API_BASE_URL}/add-faculty`, facultyForm); }
      setFacultyForm({ username: '', password: '', department: '' }); fetchData(); 
    } catch (err) { alert(err.response?.data?.error || "Error saving faculty"); }
  };

  const startEditFaculty = (f) => { setEditFacultyId(f._id); setFacultyForm({ username: f.username, password: '', department: f.department || '' }); setIsEditingFaculty(true); };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditingStudent) {
        await axios.put(`${API_BASE_URL}/update-user/${editStudentId}`, studentForm);
        setIsEditingStudent(false); setEditStudentId(null);
      } else { await axios.post(`${API_BASE_URL}/add-student`, studentForm); }
      setStudentForm({ name: '', rollNumber: '', course: '', email: '', mobile: '', password: '' }); fetchData();
    } catch (err) { alert(err.response?.data?.error || "Error!"); }
  };

  const startEditStudent = (s) => { setEditStudentId(s._id); setStudentForm({ name: s.name, rollNumber: s.rollNumber, course: s.course, email: s.email, mobile: s.mobile, password: '' }); setIsEditingStudent(true); };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!fileData) return alert("Select a file first!");
    const formData = new FormData();
    formData.append('file', fileData); formData.append('category', fileCategory); formData.append('uploadedBy', user.name);
    try {
      await axios.post(`${API_BASE_URL}/upload-file`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setFileData(null); document.getElementById('fileInput').value = ""; fetchData(); alert("File Uploaded Successfully!");
    } catch (err) { alert("Error uploading file"); }
  };

  const deleteFile = async (id) => { if(confirm("Delete this file permanently?")) { await axios.delete(`${API_BASE_URL}/delete-file/${id}`); fetchData(); } };
  const deleteRecord = async (id) => { if(confirm("Delete this user record?")) { await axios.delete(`${API_BASE_URL}/delete-user/${id}`); fetchData(); } };

  const filteredFaculties = faculties.filter(f => f.username.toLowerCase().includes(searchFaculty.toLowerCase()) || (f.department && f.department.toLowerCase().includes(searchFaculty.toLowerCase())));
  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()) || s.rollNumber.toLowerCase().includes(searchStudent.toLowerCase()) || s.course.toLowerCase().includes(searchStudent.toLowerCase()));
  const filteredFiles = uploadedFiles.filter(file => file.originalName.toLowerCase().includes(searchFile.toLowerCase()) || file.category.toLowerCase().includes(searchFile.toLowerCase()) || file.uploadedBy.toLowerCase().includes(searchFile.toLowerCase()));

  // Chart Data
  const statsData = [
    { name: 'Students', count: students.length, fill: '#0ea5e9' },
    { name: 'Faculty', count: faculties.length, fill: '#10b981' },
    { name: 'Library Files', count: uploadedFiles.length, fill: '#f59e0b' }
  ];

  const globalCSS = `
    body { margin: 0; background-color: ${theme.secondary}; font-family: 'Segoe UI', system-ui, sans-serif; }
    .lift-card { background: ${theme.card}; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid rgba(255,255,255,0.5); }
    .lift-card:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); }
    .lift-btn { border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; color: white; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .lift-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0,0,0,0.15); filter: brightness(1.05); }
    .lift-btn:active { transform: translateY(1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .flex-form { display: flex; flex-wrap: wrap; gap: 15px; }
    .form-item { flex: 1 1 250px; } 
    .nav-box { display: flex; justify-content: space-between; align-items: center; }
    @media (max-width: 768px) { .nav-box { flex-direction: column; gap: 15px; text-align: center; padding: 20px !important; } .lift-card { padding: 20px; } }
  `;

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <style>{globalCSS}</style>
      <div className="lift-card" style={{ width: '90%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: theme.primary, margin: '0', fontSize: '28px', fontWeight: '800' }}>NRI Portal</h2>
          <p style={{ color: theme.textSecondary, margin: '8px 0 0 0', fontSize: '15px' }}>Secure Enterprise Login</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <select onChange={e => setLoginData({...loginData, role: e.target.value})} style={inputStyle}>
            <option value="STUDENT">STUDENT</option>
            <option value="FACULTY">FACULTY</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <input placeholder="Enter Full Name (Student) / Username" onChange={e => setLoginData({...loginData, username: e.target.value})} required style={inputStyle} />
          <input type="password" placeholder="Password" onChange={e => setLoginData({...loginData, password: e.target.value})} required style={inputStyle} />
          <button type="submit" className="lift-btn" style={{ background: theme.buttonBlue, width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }}>Access Dashboard</button>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <style>{globalCSS}</style>
      
      {/* NAVBAR */}
      <div className="nav-box" style={{ background: theme.primary, padding: '15px 40px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '0.5px', color: '#ffffff' }}>NRI Group of Institutions</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '15px', color: '#cbd5e1' }}>Welcome, <b style={{color:'white'}}>{user.name}</b> <small>({user.role})</small></span>
          <button onClick={() => setShowPwdForm(!showPwdForm)} className="lift-btn" style={{ background: theme.buttonYellow, color: 'black' }}>Change Password</button>
          <button onClick={handleLogout} className="lift-btn" style={{ background: theme.buttonRed }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: '1250px', margin: '30px auto', padding: '0 20px' }}>
        
        {/* PASSWORD CHANGE */}
        {showPwdForm && (
          <div className="lift-card" style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '20px', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#b45309' }}>Update Account Password</h3>
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Enter your new secure password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{...inputStyle, flex: '1 1 250px', maxWidth: '400px'}} />
              <button type="submit" className="lift-btn" style={{ background: theme.buttonGreen }}>Save & Relogin</button>
              <button type="button" className="lift-btn" style={{ background: '#94a3b8' }} onClick={() => { setShowPwdForm(false); setNewPassword(''); }}>Cancel</button>
            </form>
          </div>
        )}

        {/* --- ANALYTICS DASHBOARD (ADMIN ONLY) --- */}
        {user.role === 'ADMIN' && (
          <div className="lift-card">
            <h3 style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}`, paddingBottom: '12px', marginTop: 0, fontSize: '20px' }}>System Overview Analytics</h3>
            <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
              <ResponsiveContainer>
                <BarChart data={statsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 1. DIGITAL LIBRARY */}
        <div className="lift-card">
          <h3 style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}`, paddingBottom: '12px', marginTop: 0, fontSize: '20px' }}>Digital Library & Notice Board</h3>
          {(user.role === 'ADMIN' || user.role === 'FACULTY') && (
            <form onSubmit={handleFileUpload} className="flex-form" style={{ marginBottom: '25px', background: '#f8fafc', padding: '20px', borderRadius: '10px', border: `1px solid ${theme.border}`, alignItems: 'center' }}>
              <select className="form-item" value={fileCategory} onChange={e => setFileCategory(e.target.value)} style={{...inputStyle, flex: '1 1 200px'}}>
                <option value="Study Material">Study Material</option>
                <option value="Time Table">Time Table</option>
                <option value="Notice">Notice</option>
                <option value="Assignment / Practical">Assignment / Practical</option>
              </select>
              <input className="form-item" type="file" id="fileInput" onChange={e => setFileData(e.target.files[0])} required style={{ border: 'none', padding: '10px 0', flex: '2 1 300px' }} />
              <button type="submit" className="lift-btn" style={{ background: theme.buttonGreen }}>Upload Document</button>
            </form>
          )}

          {uploadedFiles.length > 0 && <input type="text" placeholder="🔍 Search files..." value={searchFile} onChange={e => setSearchFile(e.target.value)} style={searchStyle} />}

          {uploadedFiles.length > 0 ? (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th style={tableHeader}>Category</th><th style={tableHeader}>File Name</th><th style={tableHeader}>Uploaded By</th><th style={tableHeader}>Date & Time</th><th style={tableHeader}>Action</th></tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => (
                    <tr key={file._id} style={{ transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{...tableCell, fontWeight: '700', color: theme.buttonBlue}}>{file.category}</td><td style={tableCell}>{file.originalName}</td><td style={tableCell}>{file.uploadedBy}</td>
                      <td style={{...tableCell, fontStyle: 'italic', color: theme.textSecondary, fontSize: '13px'}}>{file.uploadDate ? new Date(file.uploadDate).toLocaleString('en-IN') : '-'}</td>
                      <td style={tableCell}>
                        <a href={`${API_BASE_URL}/uploads/${file.filename}`} target="_blank" rel="noopener noreferrer" className="lift-btn" style={{ background: theme.buttonBlue, textDecoration: 'none', fontSize: '13px', display: 'inline-block', marginRight: '8px' }}>View</a>
                        {(user.role === 'ADMIN' || user.role === 'FACULTY') && <button onClick={() => deleteFile(file._id)} className="lift-btn" style={{ background: theme.buttonRed, padding: '7px 12px', fontSize: '13px' }}>Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (<p style={{ color: theme.textSecondary, textAlign: 'center', margin: '20px 0', fontSize: '16px' }}>No files available.</p>)}
        </div>

        {/* 2. FACULTY MANAGEMENT */}
        {user.role === 'ADMIN' && (
          <div className="lift-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${theme.border}`, paddingBottom: '12px', marginBottom: '15px' }}>
              <h3 style={{ color: theme.primary, margin: 0, fontSize: '20px' }}>Faculty Management</h3>
              {faculties.length > 0 && (
                <button onClick={() => exportToExcel(faculties, 'Faculty')} className="lift-btn" style={{ background: '#059669', fontSize: '13px' }}>⬇ Export to Excel</button>
              )}
            </div>
            
            <form onSubmit={handleFacultySubmit} className="flex-form" style={{ marginBottom: '20px', alignItems: 'center' }}>
              <input className="form-item" placeholder="Username" value={facultyForm.username} onChange={e => setFacultyForm({...facultyForm, username: e.target.value})} required disabled={isEditingFaculty} style={inputStyle} />
              <input className="form-item" placeholder="Department (Optional)" value={facultyForm.department} onChange={e => setFacultyForm({...facultyForm, department: e.target.value})} style={inputStyle} />
              <input className="form-item" type="text" placeholder={isEditingFaculty ? "Leave blank to keep old password" : "Password"} value={facultyForm.password} onChange={e => setFacultyForm({...facultyForm, password: e.target.value})} required={!isEditingFaculty} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px', flex: '1 1 auto' }}>
                <button type="submit" className="lift-btn" style={{ background: isEditingFaculty ? theme.buttonYellow : theme.buttonGreen, color: isEditingFaculty ? 'black' : 'white', flex: 1 }}>{isEditingFaculty ? "Update" : "Add Faculty"}</button>
                {isEditingFaculty && <button type="button" className="lift-btn" onClick={() => {setIsEditingFaculty(false); setFacultyForm({username:'', password:'', department:''});}} style={{ background: '#64748b' }}>Cancel</button>}
              </div>
            </form>

            {faculties.length > 0 && <input type="text" placeholder="🔍 Search faculty..." value={searchFaculty} onChange={e => setSearchFaculty(e.target.value)} style={searchStyle} />}

            {faculties.length > 0 && (
              <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={tableHeader}>Username</th><th style={tableHeader}>Department</th><th style={tableHeader}>Encrypted Hash / Actions</th></tr></thead>
                  <tbody>
                    {filteredFaculties.map(f => (
                      <tr key={f._id} style={{ transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={tableCell}><b>{f.username}</b></td><td style={tableCell}>{f.department || '-'}</td>
                        <td style={tableCell}>
                          <button onClick={() => startEditFaculty(f)} className="lift-btn" style={{ background: theme.buttonBlue, padding: '6px 12px', marginRight: '8px', fontSize: '13px' }}>Edit</button>
                          <button onClick={() => deleteRecord(f._id)} className="lift-btn" style={{ background: theme.buttonRed, padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. STUDENT REGISTRATION & DIRECTORY */}
        <div className="lift-card">
          {(user.role === 'ADMIN' || user.role === 'FACULTY') && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}`, paddingBottom: '12px', marginTop: 0, fontSize: '20px' }}>Student Registration</h3>
              <form onSubmit={handleStudentSubmit} className="flex-form">
                <input className="form-item" placeholder="Full Name (Username)" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required style={inputStyle} />
                <input className="form-item" placeholder="Roll Number" value={studentForm.rollNumber} onChange={e => setStudentForm({...studentForm, rollNumber: e.target.value})} required disabled={isEditingStudent} style={inputStyle} />
                <input className="form-item" placeholder="Course (e.g., B.Tech CS)" value={studentForm.course} onChange={e => setStudentForm({...studentForm, course: e.target.value})} required style={inputStyle} />
                <input className="form-item" type="email" placeholder="Email Address" value={studentForm.email} onChange={e => setStudentForm({...studentForm, email: e.target.value})} required style={inputStyle} />
                <input className="form-item" placeholder="Mobile Number" value={studentForm.mobile} onChange={e => setStudentForm({...studentForm, mobile: e.target.value})} required style={inputStyle} />
                <input className="form-item" type="text" placeholder={isEditingStudent ? "Leave blank to keep old password" : "Login Password"} value={studentForm.password} onChange={e => setStudentForm({...studentForm, password: e.target.value})} required={!isEditingStudent} style={inputStyle} />
                <div style={{ width: '100%', display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="lift-btn" style={{ background: theme.buttonBlue }}>{isEditingStudent ? "Update Student Details" : "Register Student"}</button>
                  {isEditingStudent && <button type="button" className="lift-btn" onClick={() => {setIsEditingStudent(false); setStudentForm({name:'', rollNumber:'', course:'', email:'', mobile:'', password:''});}} style={{ background: '#64748b' }}>Cancel</button>}
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${theme.border}`, paddingBottom: '12px', marginBottom: '15px' }}>
            <h3 style={{ color: theme.primary, margin: 0, fontSize: '20px' }}>{user.role === 'STUDENT' ? "My Academic Profile" : "Student Directory"}</h3>
            {user.role !== 'STUDENT' && students.length > 0 && (
              <button onClick={() => exportToExcel(students, 'Students')} className="lift-btn" style={{ background: '#059669', fontSize: '13px' }}>⬇ Export to Excel</button>
            )}
          </div>
          
          {user.role !== 'STUDENT' && students.length > 0 && <input type="text" placeholder="🔍 Search student..." value={searchStudent} onChange={e => setSearchStudent(e.target.value)} style={searchStyle} />}

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={tableHeader}>Name</th><th style={tableHeader}>Roll No.</th><th style={tableHeader}>Course</th>
                  <th style={tableHeader}>Email</th><th style={tableHeader}>Mobile</th>
                  {user.role !== 'STUDENT' && <th style={tableHeader}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s._id} style={{ transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{...tableCell, fontWeight: '600'}}>{s.name}</td><td style={tableCell}>{s.rollNumber}</td><td style={tableCell}>{s.course}</td><td style={tableCell}>{s.email}</td><td style={tableCell}>{s.mobile}</td>
                    
                    {user.role !== 'STUDENT' && (
                      <td style={tableCell}>
                        <button onClick={() => startEditStudent(s)} className="lift-btn" style={{ background: theme.buttonBlue, padding: '6px 12px', marginRight: '8px', fontSize: '13px' }}>Edit</button>
                        <button onClick={() => deleteRecord(s._id)} className="lift-btn" style={{ background: theme.buttonRed, padding: '6px 12px', fontSize: '13px' }}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;