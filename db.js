const mongoose = require('mongoose');
const Restaurant = require('./models/restaurant');
require('dotenv').config();

const db = {
    initialize: async () => {
        try {
            await mongoose.connect(process.env.MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB");
        } catch (err) {
            console.error("Failed to connect to MongoDB", err);
            throw err;
        }
    },
};

module.exports = db;

module.exports = {
    async initialize(connectionString) {
        await mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
        return Restaurant;
    },
    async addNewRestaurant(data) {
        return new Restaurant(data).save();
    },
    async getAllRestaurants(page, perPage, borough, cuisine) {
        const query = {};

        // Add borough filter if provided
        if (borough) {
            query.borough = new RegExp(borough, 'i'); // Case-insensitive search
        }

        // Add cuisine filter if provided
        if (cuisine) {
            query.cuisine = new RegExp(cuisine, 'i');
        }
        return Restaurant.find(query)
            .sort({ restaurant_id: 1 })
            .skip((page - 1) * perPage)
            .limit(perPage)
            .lean();
    },
    async getRestaurantById(id) {
        return Restaurant.findById(id);
    },
    async updateRestaurantById(id, data) {
        return Restaurant.findByIdAndUpdate(id, data, { new: true });
    },
    async deleteRestaurantById(id) {
        return Restaurant.findByIdAndDelete(id);
    },
};