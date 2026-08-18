const { query } = require("./db");

/**
 * Inserts a notification row. Shared by circle.js (friend request/accept),
 * sessions.js (share), and chat.js (new message) so the shape stays
 * consistent instead of each route hand-rolling its own insert + payload
 * JSON encoding.
 */
async function notify(userId, type, payload = {}) {
  await query(
    "INSERT INTO notifications (user_id, type, payload) VALUES ($1, $2, $3)",
    [userId, type, JSON.stringify(payload)]
  );
}

module.exports = { notify };
