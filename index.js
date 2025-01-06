const { WebServiceClient } = require('@maxmind/geoip2-node');
const axios = require('axios');
const express = require('express');
const app = express();
require('dotenv').config()


const accountId = process.env.ACCOUNT_ID;  // Replace with your account ID
const licenseKey = process.env.LICENSE_KEY;
const port = process.env.PORT || 3000;



async function getUserDetailsByIP(ipAddress) {
    try {

        // API endpoint for GeoIP2 Precision Web Services
        const url = `https://geoip.maxmind.com/geoip/v2.1/city/${ipAddress}?pretty`;

        // Make the API request with Basic Authentication
        const response = await axios.get(url, {
            auth: {
                username: accountId,
                password: licenseKey,
            },
        });

        const data = response.data;

        // Return the parsed user details
        return {
            ip: data.traits.ip_address || 'Unknown',
            isp: data.traits.organization || 'Unknown',
            connectionType: data.traits.connection_type || 'Unknown',
            country: data.country?.names?.en || 'Unknown',
            countryCode2: data.country?.iso_code || 'Unknown',
            city: data.city?.names?.en || 'Unknown',
            region: data.subdivisions[0]?.iso_code || 'Unknown',
            regionName: data.subdivisions[0]?.names?.en || 'Unknown',
            latitude: data.location?.latitude || 'Unknown',
            longitude: data.location?.longitude || 'Unknown',
            Zip: data.postal?.code || 'Unknown',

        };
    } catch (error) {
        console.error('Error retrieving user details:', error.message);
        console.log(error);

        // Handle specific error cases
        if (error.response?.status === 404) {
            return { error: 'IP address not found in the MaxMind database' };
        }

        return { error: 'An error occurred while fetching IP details' };
    }
}

app.get('/', async (req, res) => {
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    ip = ip.split(',')[0].trim(); // Use the first IP in case of a list
    if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', ''); // Handle IPv4-mapped IPv6 address

    // Get user details by IP address
    const userDetails = await getUserDetailsByIP(ip);

    // Return the IP and user details as a response
    res.json({
        ip,
        userDetails
    });
});

app.get('/ip', async (req, res) => {
    const client = new WebServiceClient(accountId, licenseKey);

    try {
        // Get the IP address from headers or connection
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ip = ip.split(',')[0].trim();

        // Handle IPv6 addresses with embedded IPv4
        if (ip.includes('::ffff:')) ip = ip.replace('::ffff:', '');

        // Fetch location data for the IP
        const response = await client.city(ip);

        // Extract country code and send the full response
        console.log(response.country.isoCode);
        res.send(response);
    } catch (error) {
        console.error('Error fetching IP information:', error);
        res.status(500).send({ error: 'Failed to retrieve IP information' });
    }
});
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
