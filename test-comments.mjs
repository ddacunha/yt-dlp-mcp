#!/usr/bin/env node

import { downloadComments } from './lib/modules/comment.js';
import { CONFIG } from './lib/config.js';

// Test video URL - using a popular YouTube video with many comments
const testUrl = 'https://youtu.be/5fLKwtGp4jA?si=fp43ew1ZJTwWFj70';

async function testCommentDownload() {
  try {
    console.log(`Testing comment download for: ${testUrl}`);
    console.log('Downloading comments...');
    
    // Create a promise that rejects after a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out after 30 seconds')), 30000);
    });
    
    // Race the download against the timeout
    const comments = await Promise.race([
      downloadComments(testUrl, CONFIG),
      timeoutPromise
    ]);
    
    console.log('Comments downloaded successfully!');
    console.log('Sample of comments:');
    
    const parsedComments = JSON.parse(comments);
    console.log(`Total comments: ${parsedComments.comment_count}`);
    console.log(`Video title: ${parsedComments.video_title}`);
    
    // Display the structure of the first comment
    if (parsedComments.comments && parsedComments.comments.length > 0) {
      console.log('\nFirst comment structure:');
      console.log(JSON.stringify(parsedComments.comments[0], null, 2));
      
      // Display first few comments
      parsedComments.comments.slice(0, 3).forEach((comment, index) => {
        console.log(`\nComment #${index + 1}:`);
        console.log(`Author: ${comment.author}`);
        console.log(`Text: ${comment.text}`);
        console.log(`Time: ${comment.time || 'Not available'}`);
        console.log(`Likes: ${comment.like_count}`);
      });
    } else {
      console.log('No comments found or comments are disabled for this video.');
    }
  } catch (error) {
    console.error('Error testing comment download:', error);
  }
}

testCommentDownload();
