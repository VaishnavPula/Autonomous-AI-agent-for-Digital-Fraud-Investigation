import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('renders error message', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
  });

  it('handles value changes', () => {
    render(<Input defaultValue="initial" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    fireEvent.change(input, { target: { value: 'updated' } });
    expect(input).toHaveValue('updated');
  });

  it('calls onChange handler', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
  });

  it('applies disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('renders helper text', () => {
    render(<Input helperText="Enter your email" />);
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
  });
});