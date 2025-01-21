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
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prxjz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB!");

    // Collections
    const campaignsCollection = client.db("campaignsDB").collection("campaigns");
    const donationsCollection = client.db("campaignsDB").collection("donations");

    // Routes
    app.get("/campaigns", async (req, res) => {
      const cursor = campaignsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/myCampaign", async (req, res) => {
      const email = req.query.email;
      const result = await campaignsCollection.find({ email }).toArray();
      res.send(result);
    });

    app.get("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignsCollection.findOne(query);
      res.send(result);
    });

    app.get("/runningCampaigns", async (req, res) => {
      const today = new Date();
      const runningCampaigns = await campaignsCollection
        .find({
          $expr: {
            $gte: [{ $toDate: "$deadline" }, today],
          },
        })
        .limit(6)
        .toArray();
      res.send(runningCampaigns);
    });

    app.get("/myDonations", async (req, res) => {
      const email = req.query.email;
      const donations = await donationsCollection
        .find({ userEmail: email })
        .toArray();
      res.send(donations);
    });

    app.post("/campaigns", async (req, res) => {
      const { deadline, ...rest } = req.body;
      const newCampaign = {
        ...rest,
        deadline: new Date(deadline),
      };
      const result = await campaignsCollection.insertOne(newCampaign);
      res.send(result);
    });

    app.post("/donations", async (req, res) => {
      const donation = req.body;
      const result = await donationsCollection.insertOne(donation);
      res.send(result);
    });

    app.put("/campaigns/:id", async (req, res) => {
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
      const result = await campaignsCollection.updateOne(filter, campaign, options);
      res.send(result);
    });

    app.delete("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignsCollection.deleteOne(query);
      res.send(result);
    });

    // Ping MongoDB
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Uncomment for production to close connections properly
    // await client.close();
  }
}
run().catch(console.dir);

// Default Route
app.get("/", (req, res) => {
  res.send("Crowdcube server is running");
});

// Start Server
app.listen(port, () => {
  console.log(`Crowdcube server is running on port: ${port}`);
});