import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Landing from '../pages/Landing';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';

describe('Landing Page', () => {
  it('renders the forms', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    expect(screen.getByText('Create New Room')).toBeDefined();
    expect(screen.getByText('Join Room')).toBeDefined();
  });

  it('shows error if name is missing when creating a room', () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );
    
    const initialTaskInput = screen.getByPlaceholderText(/e.g. US-101/i);
    fireEvent.change(initialTaskInput, { target: { value: 'Task 1' } });

    const createButton = screen.getByRole('button', { name: /Create New Room/i });
    fireEvent.click(createButton);
    
    const nameInput = screen.getByPlaceholderText(/Enter your name/i);
    expect(nameInput.className).toContain('border-red-500');
  });
});
