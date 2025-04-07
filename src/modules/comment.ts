import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { Config } from '../config.js';
import { _spawnPromise, validateUrl } from "./utils.js";

/**
 * Downloads comments for a video.
 * 
 * @param url - The URL of the video
 * @param config - Configuration object
 * Note: All available comments will be downloaded
 * @returns Promise resolving to the comments content in JSON format
 * @throws {Error} When URL is invalid or download fails
 * 
 * @example
 * ```typescript
 * try {
 *   const comments = await downloadComments('https://youtube.com/watch?v=...', config);
 *   console.log('Comments:', comments);
 * } catch (error) {
 *   console.error('Failed to download comments:', error);
 * }
 * ```
 */
export async function downloadComments(
  url: string,
  config: Config
): Promise<string> {
  if (!validateUrl(url)) {
    throw new Error('Invalid or unsupported URL format');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), config.file.tempDirPrefix));

  try {
    // Use yt-dlp to download comments in JSON format
    const jsonData = await _spawnPromise('yt-dlp', [
      '--skip-download',
      '--write-comments',
      '--dump-single-json',
      url
    ]);

    // Parse the JSON data
    const parsedData = JSON.parse(jsonData);
    
    // Extract comments from the JSON data
    if (!parsedData.comments) {
      return JSON.stringify({ 
        comments: [],
        message: "No comments found or comments are disabled for this video"
      });
    }
    
    // Format the comments for better readability
    const formattedComments = parsedData.comments.map((comment: any) => {
      // Format timestamp to readable date if available
      let formattedTime = null;
      if (comment.timestamp) {
        formattedTime = new Date(comment.timestamp * 1000).toISOString();
      }
      
      return {
        id: comment.id,
        text: comment.text,
        author: comment.author,
        author_id: comment.author_id,
        time: formattedTime,
        timestamp: comment.timestamp,
        like_count: comment.like_count,
        is_favorited: comment.is_favorited,
        parent: comment.parent
      };
    });
    
    return JSON.stringify({
      comments: formattedComments,
      video_id: parsedData.id,
      video_title: parsedData.title,
      comment_count: formattedComments.length
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download comments: ${error.message}`);
    }
    throw error;
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}
