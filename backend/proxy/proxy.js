const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Para aceitar strings longas de XML

app.get('/api/fortisiem/incidents', async (req, res) => {
    try {
        const { username, password, status, timeFrom, timeTo, size } = req.query;

        const params = { status, timeFrom, timeTo, size };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await axios.get(
            'https://148.230.50.68:14006/phoenix/rest/pub/incident',
            {
                auth: { username, password },
                params,
                httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
            }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message, details: err?.response?.data });
    }
});

app.listen(3001, () => {
    console.log('Proxy rodando em http://localhost:3001');
});