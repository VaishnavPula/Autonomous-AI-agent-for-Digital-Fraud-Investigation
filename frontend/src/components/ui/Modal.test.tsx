import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(<Modal isOpen={false} onClose={jest.fn()}>Content</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(<Modal isOpen={true} onClose={jest.fn()}>Content</Modal>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/content/i)).toBeInTheDocument();
  });

  it('renders title', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} title="Test Title">Content</Modal>);
    expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);
    fireEvent.click(screen.getByRole('dialog').parentElement!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when content clicked', () => {
    const handleClose = jest.fn();
    render(<Modal isOpen={true} onClose={handleClose}>Content</Modal>);
    fireEvent.click(screen.getByText(/content/i));
    expect(handleClose).not.toHaveBeenCalled();
  });

  it('applies size classes', () => {
    render(<Modal isOpen={true} onClose={jest.fn()} size="lg">Content</Modal>);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-2xl');
  });
});