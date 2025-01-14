const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());


// Routes
app.get('/', (req, res) => {
  res.send('Server is Running...!');
});



// Listen
app.listen(port, () => {
    console.log(`CrowdCube server is running on port: ${port}`)
});