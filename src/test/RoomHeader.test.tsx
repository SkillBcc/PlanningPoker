import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomHeader } from '../features/room/components/RoomHeader';
import React from 'react';
import { RoomState } from '../core/services/WebSocketService';

describe('RoomHeader', () => {
  const mockActions = {
    reveal: vi.fn(),
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resetTimer: vi.fn(),
    setTimerDuration: vi.fn()
  };

  const mockRoomState: RoomState = {
    id: 'room-1',
    ownerId: 'user-1',
    activeTaskId: 'task-1',
    tasks: [
      {
        id: 'task-1',
        title: 'Initial Task',
        votes: {},
        isRevealed: false
      }
    ],
    createdAt: Date.now(),
    users: [],
    timerSeconds: 120,
    timerIsRunning: false,
    timerDuration: 120,
    deckType: 'simplified',
    autoReveal: false
  };

  it('renders logo and room id correctly', () => {
    render(
      <RoomHeader 
        roomState={mockRoomState} 
        isOwner={true} 
        copied={false} 
        timeLeft="02:00" 
        onCopyLink={vi.fn()} 
        actions={mockActions} 
      />
    );
    expect(screen.getByText('room-1')).toBeDefined();
  });

  it('renders timer display correctly', () => {
    render(
      <RoomHeader 
        roomState={mockRoomState} 
        isOwner={true} 
        copied={false} 
        timeLeft="02:00" 
        onCopyLink={vi.fn()} 
        actions={mockActions} 
      />
    );
    expect(screen.getByText('02:00')).toBeDefined();
  });
});
