import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskSidebar } from '../features/room/components/TaskSidebar';
import React from 'react';
import { RoomState } from '../core/services/WebSocketService';

describe('TaskSidebar', () => {
  const mockActions = {
    setActiveTask: vi.fn(),
    editTask: vi.fn(),
    deleteTask: vi.fn(),
    addTask: vi.fn(),
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

  it('renders correctly', () => {
    render(<TaskSidebar roomState={mockRoomState} isOwner={true} actions={mockActions} />);
    expect(screen.getByText('Initial Task')).toBeDefined();
  });

  it('shows an error when adding a duplicate task', () => {
    render(<TaskSidebar roomState={mockRoomState} isOwner={true} actions={mockActions} />);
    const input = screen.getByPlaceholderText(/e.g. Navigation Header/i);
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'Initial Task' } });
    if (form) fireEvent.submit(form);
    
    expect(screen.getByText('This task already exists. Please choose another name.')).toBeDefined();
    expect(mockActions.addTask).not.toHaveBeenCalled();
  });

  it('calls addTask when adding a new unique task', () => {
    render(<TaskSidebar roomState={mockRoomState} isOwner={true} actions={mockActions} />);
    const input = screen.getByPlaceholderText(/e.g. Navigation Header/i);
    const form = input.closest('form');
    
    fireEvent.change(input, { target: { value: 'New Task' } });
    if (form) fireEvent.submit(form);
    
    expect(mockActions.addTask).toHaveBeenCalledWith('New Task');
  });
});
