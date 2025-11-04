const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb+srv://rahulroy0703_db_user:rahulroy0703@spawellcluster.j6t1ffe.mongodb.net/spawellDB?retryWrites=true&w=majority&appName=SpawellCluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define schema and model
const bookingSchema = new mongoose.Schema({
  name: String,
   contact: String,
  email: String,
  service: String,
  date: String,
  notes: String
});

const Booking = mongoose.model('Booking', bookingSchema);

// POST route to handle booking submissions
app.post('/submit', async (req, res) => {
  const { name, email, phone, service, date, notes } = req.body;

  if (!name || !email || !phone || !service || !date) {
    return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  try {
    const booking = new Booking({ name, email, phone, service, date, notes });
    await booking.save();
    console.log('New booking saved:', booking);
    res.status(200).json({ message: 'Booking submitted successfully!' });
  } catch (err) {
    console.error('Error saving booking:', err);
    res.status(500).json({ message: 'Failed to save booking.' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Spawell backend running at http://localhost:${PORT}`);
});
