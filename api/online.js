// api/online.js
let activeUsers = {};

export default function handler(req, res) {
    const { id } = req.query; 
    const now = Date.now();

    // If a user ID is provided, update their last active timestamp
    if (id) {
        activeUsers[id] = now;
    }

    // Clean up users who haven't pinged in the last 60 seconds (60000 ms)
    const activeThreshold = now - 60000;
    let count = 0;
    
    for (const userId in activeUsers) {
        if (activeUsers[userId] > activeThreshold) {
            count++;
        } else {
            // Delete inactive users from memory
            delete activeUsers[userId];
        }
    }

    // Set CORS headers so your frontend can read the data
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Return the active user count
    res.status(200).json({ online: count });
}