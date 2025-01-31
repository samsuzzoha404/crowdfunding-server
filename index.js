require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//midleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.prxjz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    // await client.connect();

    const campaignsCollection = client
      .db("campaignsDB")
      .collection("campaigns");
    const donationsCollection = client
      .db("campaignsDB")
      .collection("donations");

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
      // Fetch 6 running campaigns where the deadline has not passed
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

    // For MyDonation Page
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

    // For Donation Data
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
          campaignTitle: updatedCampaign.campaignTitle,
          campaignType: updatedCampaign.campaignType,
          description: updatedCampaign.description,
          minimumDonationAmount: updatedCampaign.minimumDonationAmount,
          deadline: updatedCampaign.deadline,
          email: updatedCampaign.email,
          name: updatedCampaign.name,
          photo: updatedCampaign.photo,
        },
      };
      const result = await campaignsCollection.updateOne(
        filter,
        campaign,
        options
      );
      res.send(result);
    });

    app.delete("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignsCollection.deleteOne(query);
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Crowdcube server is running");
});

app.listen(port, () => {
  console.log(`Crowdcube server is running on port: ${port}`);
});
