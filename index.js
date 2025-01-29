require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://crowd-funding-40464.web.app", 
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true,
  })
);
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
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    // Initialize collections
    const db = client.db("campaignsDB");
    campaignsCollection = db.collection("campaigns");
    donationsCollection = db.collection("donations");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
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
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Failed to fetch campaigns", error });
  }
});

// Get campaigns by user email
app.get("/myCampaign", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await campaignsCollection.find({ email }).toArray();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user campaigns:", error);
    res.status(500).json({ message: "Failed to fetch user campaigns", error });
  }
});

// Get campaign by ID
app.get("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    const query = { _id: new ObjectId(id) };
    const result = await campaignsCollection.findOne(query);
    if (!result) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    res.status(500).json({ message: "Failed to fetch campaign", error });
  }
});

// Get running campaigns
app.get("/runningCampaigns", async (req, res) => {
  try {
    const today = new Date();
    const runningCampaigns = await campaignsCollection
      .find({ deadline: { $gte: today } })
      .limit(6)
      .toArray();

    res.status(200).json(runningCampaigns);
  } catch (error) {
    console.error("Error fetching running campaigns:", error);
    res.status(500).json({ message: "Failed to fetch running campaigns", error });
  }
});

// Get donations by user email
app.get("/myDonations", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const donations = await donationsCollection
      .find({ userEmail: email })
      .toArray();
    res.status(200).json(donations);
  } catch (error) {
    console.error("Error fetching user donations:", error);
    res.status(500).json({ message: "Failed to fetch user donations", error });
  }
});

// Add a campaign
app.post("/campaigns", async (req, res) => {
  try {
    const { deadline, ...rest } = req.body;
    if (!deadline || !rest.title || !rest.description || !rest.email) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newCampaign = {
      ...rest,
      deadline: new Date(deadline),
    };
    const result = await campaignsCollection.insertOne(newCampaign);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding campaign:", error);
    res.status(500).json({ message: "Failed to add campaign", error });
  }
});

// Add a donation
app.post("/donations", async (req, res) => {
  try {
    const donation = req.body;
    if (!donation.userEmail || !donation.campaignId || !donation.amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const result = await donationsCollection.insertOne(donation);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error adding donation:", error);
    res.status(500).json({ message: "Failed to add donation", error });
  }
});

// Update a campaign
app.put("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedCampaign = req.body;
    const campaign = {
      $set: {
        ...updatedCampaign,
        deadline: new Date(updatedCampaign.deadline),
      },
    };
    const result = await campaignsCollection.updateOne(filter, campaign, options);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ message: "Failed to update campaign", error });
  }
});

// Delete a campaign
app.delete("/campaigns/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    const query = { _id: new ObjectId(id) };
    const result = await campaignsCollection.deleteOne(query);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ message: "Failed to delete campaign", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Crowdcube server is running on port: ${port}`);
});