import { downloadComments } from '../modules/comment.js';
import { CONFIG } from '../config.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock the dependencies
jest.mock('../modules/utils.js', () => ({
  _spawnPromise: jest.fn(),
  validateUrl: jest.fn().mockReturnValue(true)
}));

jest.mock('fs', () => ({
  mkdtempSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  rmSync: jest.fn(),
  promises: {
    rm: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/'))
}));

jest.mock('os', () => ({
  tmpdir: jest.fn().mockReturnValue('/tmp')
}));

import { _spawnPromise, validateUrl } from '../modules/utils.js';

describe('Comment Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.mkdtempSync as jest.Mock).mockReturnValue('/tmp/ytdlp-test');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  describe('downloadComments', () => {
    const mockUrl = 'https://www.youtube.com/watch?v=test123';
    
    it('should throw an error if URL is invalid', async () => {
      (validateUrl as jest.Mock).mockReturnValueOnce(false);
      
      await expect(downloadComments(mockUrl, CONFIG)).rejects.toThrow('Invalid or unsupported URL format');
    });

    it('should download comments successfully', async () => {
      // Define a more complete mock comment structure that matches yt-dlp output
      const mockCommentsData = {
        comments: [
          { 
            id: 'comment1',
            text: 'Great video!', 
            author: 'User1', 
            author_id: 'user1id',
            time_text: '2 months ago',
            timestamp: 1234567890,
            like_count: 42,
            is_favorited: false,
            parent: 'root'
          },
          { 
            id: 'comment2',
            text: 'Very informative', 
            author: 'User2', 
            author_id: 'user2id',
            time_text: '1 month ago',
            timestamp: 1234567891,
            like_count: 15,
            is_favorited: false,
            parent: 'root'
          }
        ],
        id: 'test123',
        title: 'Test Video'
      };
      
      (_spawnPromise as jest.Mock).mockResolvedValue(JSON.stringify(mockCommentsData));
      
      const result = await downloadComments(mockUrl, CONFIG);
      
      expect(_spawnPromise).toHaveBeenCalledWith('yt-dlp', [
        '--skip-download',
        '--write-comments',
        '--dump-single-json',
        mockUrl
      ]);
      
      const expectedResult = {
        comments: mockCommentsData.comments.map(comment => ({
          id: comment.id,
          text: comment.text,
          author: comment.author,
          author_id: comment.author_id,
          time: comment.time_text,
          timestamp: comment.timestamp,
          like_count: comment.like_count,
          is_favorited: comment.is_favorited,
          parent: comment.parent
        })),
        video_id: mockCommentsData.id,
        video_title: mockCommentsData.title,
        comment_count: mockCommentsData.comments.length
      };
      
      expect(result).toBe(JSON.stringify(expectedResult));
      expect(fs.rmSync).toHaveBeenCalledWith('/tmp/ytdlp-test', { recursive: true, force: true });
    });

    it('should handle the case when no comments are found', async () => {
      const mockData = {
        id: 'test123',
        title: 'Test Video'
      };
      
      (_spawnPromise as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
      
      const result = await downloadComments(mockUrl, CONFIG);
      
      expect(result).toBe(JSON.stringify({
        comments: [],
        message: "No comments found or comments are disabled for this video"
      }));
    });

    it('should throw an error if JSON parsing fails', async () => {
      (_spawnPromise as jest.Mock).mockResolvedValue('Invalid JSON');
      
      await expect(downloadComments(mockUrl, CONFIG)).rejects.toThrow();
    });


  });
});
