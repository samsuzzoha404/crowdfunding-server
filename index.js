require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prxjz.mongodb.net/?retryWrites=true&w=majority`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let campaignsCollection;
let donationsCollection;

async function connectToDatabase() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    // Initialize collections
    const db = client.db("campaignsDB");
    campaignsCollection = db.collection("campaigns");
    donationsCollection = db.collection("donations");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit if the database connection fails
  }
}

connectToDatabase();

// Routes
app.get("/", (req, res) => {
  res.send("Crowdcube server is running");
});

// Get all campaigns
app.get("/campaigns", async (req, res) => {
  try {
    const result = await campaignsCollection.find().toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch campaigns", error });
  }
});

// Get campaigns by user email
app.get("/myCampaign", async (req, res) => {
  try {
    const email = req.query.email;
    const result = await campaignsCollection.find({ email }).toArray();
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user campaigns", error });
  }
});

// Get campaign by ID
app.get("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await campaignsCollection.findOne(query);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch campaign", error });
  }
});

// Get running campaigns (with future deadlines)
app.get("/runningCampaigns", async (req, res) => {
  try {
    const today = new Date();
    const runningCampaigns = await campaignsCollection
      .find({
        $expr: {
          $gte: [{ $toDate: "$deadline" }, today],
        },
      })
      .limit(6)
      .toArray();
    res.status(200).send(runningCampaigns);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch running campaigns", error });
  }
});

// Get donations by user email
app.get("/myDonations", async (req, res) => {
  try {
    const email = req.query.email;
    const donations = await donationsCollection
      .find({ userEmail: email })
      .toArray();
    res.status(200).send(donations);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user donations", error });
  }
});

// Add a new campaign
app.post("/campaigns", async (req, res) => {
  try {
    const { deadline, ...rest } = req.body;
    const newCampaign = {
      ...rest,
      deadline: new Date(deadline),
    };
    const result = await campaignsCollection.insertOne(newCampaign);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add campaign", error });
  }
});

// Add a donation
app.post("/donations", async (req, res) => {
  try {
    const donation = req.body;
    const result = await donationsCollection.insertOne(donation);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add donation", error });
  }
});

// Update a campaign
app.put("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedCampaign = req.body;
    const campaign = {
      $set: {
        ...updatedCampaign,
        deadline: new Date(updatedCampaign.deadline),
      },
    };
    const result = await campaignsCollection.updateOne(
      filter,
      campaign,
      options
    );
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update campaign", error });
  }
});

// Delete a campaign
app.delete("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await campaignsCollection.deleteOne(query);
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete campaign", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Crowdcube server is running on port: ${port}`);
});
