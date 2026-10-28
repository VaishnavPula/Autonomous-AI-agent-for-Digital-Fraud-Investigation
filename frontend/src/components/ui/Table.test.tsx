import { render, screen } from '@testing-library/react';
import { Table } from './Table';

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
];

const data = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
];

describe('Table', () => {
  it('renders headers', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText(/name/i)).toBeInTheDocument();
    expect(screen.getByText(/email/i)).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<Table columns={columns} data={data} />);
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<Table columns={columns} data={[]} emptyMessage="No data" />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it('calls onRowClick', () => {
    const handleRowClick = jest.fn();
    render(<Table columns={columns} data={data} onRowClick={handleRowClick} />);
    fireEvent.click(screen.getByText(/john doe/i).closest('tr')!);
    expect(handleRowClick).toHaveBeenCalledWith(data[0]);
  });

  it('renders custom cell renderers', () => {
    const customColumns = [
      { key: 'name', header: 'Name', render: (value) => <strong>{value}</strong> },
    ];
    render(<Table columns={customColumns} data={data} />);
    expect(screen.getByText(/john doe/i).parentElement).toHaveHTMLTag('strong');
  });

  it('applies striped rows', () => {
    render(<Table columns={columns} data={data} striped />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveClass('bg-gray-50');
  });
});