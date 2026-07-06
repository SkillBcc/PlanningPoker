import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wsService } from '../core/services/WebSocketService';

describe('WebSocketService', () => {
  beforeEach(() => {
    // Clear localStorage before each test if needed
    localStorage.clear();
  });

  it('generates and retrieves a userId', () => {
    const userId = wsService.getUserId();
    expect(userId).toBeDefined();
    expect(typeof userId).toBe('string');
  });

  it('sets and gets userName', () => {
    wsService.setUserName('Test User');
    expect(wsService.getUserName()).toBe('Test User');
    expect(localStorage.getItem('poker_user_name')).toBe('Test User');
  });
});
