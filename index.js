const axios = require('axios');
const express = require('express');
const app = express();
require('dotenv').config()


const port = process.env.PORT || 3000;

/**
 * Get user details by IP address using MaxMind's GeoIP2 API
 * @param {string} ipAddress - The IP address of the user
 * @returns {Object} - User details (e.g., country, city, etc.)
 */
async function getUserDetailsByIP(ipAddress) {
    try {
        // Replace with your MaxMind API credentials
        const accountId = process.env.ACCOUNT_ID;  // Replace with your account ID
        const licenseKey = process.env.LICENSE_KEY; // Replace with your license key

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
            country: data.country?.names?.en || 'Unknown',
            city: data.city?.names?.en || 'Unknown',
            latitude: data.location?.latitude || 'Unknown',
            longitude: data.location?.longitude || 'Unknown',
            timeZone: data.location?.time_zone || 'Unknown',
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
    console.log(req.headers);


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

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
