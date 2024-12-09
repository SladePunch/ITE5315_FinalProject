const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
    const { page = 1, perPage = 5, borough } = req.body;
    try {
        const restaurants = await db.getAllRestaurants(parseInt(page), parseInt(perPage), borough);

        console.log('Fetched Restaurants:', restaurants);  // Log the result for debugging
        res.render('results', { restaurants: restaurants });
    } catch (err) {
        console.error(err);
        res.status(500).send('Unable to fetch restaurants.');
    }
});

router.post('/', async (req, res) => {
    const { page = 1, perPage = 5, borough } = req.query;
    try {
        const restaurants = await db.getAllRestaurants(parseInt(page), parseInt(perPage), borough);
        res.send(restaurants);
    } catch (err) {
        res.status(500).send('Unable to fetch restaurants.');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const restaurant = await db.getRestaurantById(req.params.id);
        if (!restaurant) return res.status(404).send('Restaurant not found.');
        res.send(restaurant);
    } catch (err) {
        res.status(500).send('Unable to fetch restaurant.');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const restaurant = await db.updateRestaurantById(req.params.id, req.body);
        if (!restaurant) return res.status(404).send('Restaurant not found.');
        res.send(restaurant);
    } catch (err) {
        res.status(500).send('Unable to update restaurant.');
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const restaurant = await db.deleteRestaurantById(req.params.id);
        if (!restaurant) return res.status(404).send('Restaurant not found.');
        res.status(204).send();
    } catch (err) {
        res.status(500).send('Unable to delete restaurant.');
    }
});

module.exports = router;