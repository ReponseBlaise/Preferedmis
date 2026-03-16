const jwt = require('jsonwebtoken');
const token = '5zOXzp8Z1HatzY1a5vmaKFtqBY9Vh5rrbthgR15E8Xhn35gdm1aQwjX3Cv2W60VVWVfSfED1STxXLj6uEmqZEg==';
const SUPABASE_JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZndiaWRiaWZhd3JlZnBwaXhsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMjk4MywiZXhwIjoyMDgyMzg4OTgzfQ.kakj752wDIMrUGHG62NH_5wuy-0G1RzIXkfHLbY7E3I'; // Replace with your actual secret

// Decode without verifying
const decoded = jwt.decode(token, { complete: true });
console.log('Decoded payload:', decoded);

// Verify token
try {
    const verified = jwt.verify(token, SUPABASE_JWT_SECRET);
    console.log('Verified payload:', verified);
} catch (err) {
    console.error('Invalid token:', err.message);
}