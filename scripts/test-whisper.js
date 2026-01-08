// Test script for Whisper integration
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/coach/test-transcribe';
const TEST_VIDEO_PATH = path.join(__dirname, 'test-video.webm');

// Check if test video exists
if (!fs.existsSync(TEST_VIDEO_PATH)) {
  console.error(`Test video not found at ${TEST_VIDEO_PATH}`);
  console.log('Please create a test video file named "test-video.webm" in the scripts directory');
  process.exit(1);
}

// Create form data
const formData = new FormData();
formData.append('videoFile', fs.createReadStream(TEST_VIDEO_PATH));

// Send request
console.log('Sending test video for transcription...');
console.log(`Video size: ${(fs.statSync(TEST_VIDEO_PATH).size / 1024).toFixed(2)} KB`);

axios.post(API_URL, formData, {
  headers: {
    ...formData.getHeaders(),
    'Authorization': 'Bearer dev-test-token'
  }
})
.then(response => {
  console.log('Transcription successful!');
  console.log('Transcript:');
  console.log('----------------------------------------');
  console.log(response.data.transcript);
  console.log('----------------------------------------');
  console.log('Response details:', {
    size: response.data.size,
    mimetype: response.data.mimetype
  });
})
.catch(error => {
  console.error('Error during transcription:');
  if (error.response) {
    console.error('Server response:', error.response.data);
  } else {
    console.error(error.message);
  }
});