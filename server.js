const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB (replace with your Atlas connection string)
mongoose.connect('mongodb+srv://your-username:your-password@cluster.mongodb.net/teamplanner?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,  // Hashed
  role: String,  // 'team' or 'admin'
  teamId: String
});
const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'To Do' },  // To Do, In Progress, Done
  assignee: String,
  dueDate: Date,
  teamId: String,
  progress: { type: Number, default: 0 }  // 0-100%
});
const ClockDataSchema = new mongoose.Schema({
  userId: String,
  clockInTime: Date,
  clockOutTime: Date,
  date: Date,
  hoursWorked: Number
});

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);
const ClockData = mongoose.model('ClockData', ClockDataSchema);

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, 'secretKey', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    const token = jwt.sign({ id: user._id, role: user.role, teamId: user.teamId }, 'secretKey');
    res.json({ token, role: user.role, teamId: user.teamId });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/register', async (req, res) => {  // For setup; remove in prod
  const { username, password, role, teamId } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword, role, teamId });
  await user.save();
  res.json({ message: 'User created' });
});

app.get('/api/tasks', authenticate, async (req, res) => {
  const { teamId } = req.query;
  const tasks = await Task.find({ teamId });
  res.json(tasks);
});

app.post('/api/tasks', authenticate, async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.put('/api/tasks/:id', authenticate, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

app.get('/api/progress', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const progress = await Task.aggregate([
    { $group: { _id: '$teamId', avgProgress: { $avg: '$progress' } } }
  ]);
  res.json(progress.reduce((acc, p) => ({ ...acc, [p._id]: p.avgProgress }), {}));
});

app.get('/api/user-reports', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { sortBy, filter } = req.query;  // sortBy: 'team' or 'employee', filter: teamId or userId
  let query = {};
  if (filter) query[sortBy === 'team' ? 'teamId' : 'userId'] = filter;
  const reports = await ClockData.aggregate([
    { $match: query },
    { $group: { _id: sortBy === 'team' ? '$teamId' : '$userId', avgClockIn: { $avg: { $hour: '$clockInTime' } }, avgHours: { $avg: '$hoursWorked' } } }
  ]);
  res.json(reports);
});

// Mock clock-in data fetch (replace with your API)
cron.schedule('0 0 * * *', async () => {
  try {
    // Simulate fetching from your clock-in system (e.g., axios.get('https://your-clockin-api.com/data'))
    const mockData = [
      { userId: 'user1', clockInTime: new Date(), clockOutTime: new Date(Date.now() + 8*60*60*1000), hoursWorked: 8 }
    ];
    for (const entry of mockData) {
      const clockEntry = new ClockData(entry);
      await clockEntry.save();
    }
    console.log('Clock data updated');
  } catch (err) {
    console.error('Error fetching clock data:', err);
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));