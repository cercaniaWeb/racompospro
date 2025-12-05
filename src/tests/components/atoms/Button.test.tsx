import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/atoms/Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const onClickMock = jest.fn();
    render(<Button onClick={onClickMock}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  test('applies correct variant classes', () => {
    const { rerender } = render(<Button variant="primary">Button</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('bg-primary-600');
    
    rerender(<Button variant="secondary">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
    
    rerender(<Button variant="danger">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  test('applies correct size classes', () => {
    const { rerender } = render(<Button size="sm">Button</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('text-xs');
    
    rerender(<Button size="md">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');
    
    rerender(<Button size="lg">Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });

  test('is disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
});