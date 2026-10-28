'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Button,
  Input,
  Modal,
  Table,
  Badge,
  Dropdown,
  Card,
} from '@/components/ui';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

import { Column } from '@/components/ui/Table';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  is_superuser: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}

interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export function UserManagement() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<UserListResponse>({
    queryKey: ['users', page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '10',
        ...(search && { search }),
      });
      const response = await api.get<any>(`/users?${params}`);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<User> & { password: string }) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/users/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      email: formData.get('email') as string,
      username: formData.get('username') as string,
      full_name: formData.get('full_name') as string,
      password: formData.get('password') as string,
      is_active: true,
      is_verified: false,
      is_superuser: false,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editingUser.id,
      data: {
        email: formData.get('email') as string,
        username: formData.get('username') as string,
        full_name: formData.get('full_name') as string,
        is_active: formData.get('is_active') === 'on',
        is_verified: formData.get('is_verified') === 'on',
        is_superuser: formData.get('is_superuser') === 'on',
      },
    });
  };

const columns: Column<User>[] = [
    { key: 'email', header: 'Email' },
    { key: 'username', header: 'Username' },
    { key: 'full_name', header: 'Full Name' },
    {
      key: 'roles',
      header: 'Roles',
      render: (user: User) => (
        <div className="flex gap-1 flex-wrap">
          {user.roles.map((role) => (
            <Badge key={role} variant="default">{role}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Badge variant={user.is_active ? 'default' : 'default'} className={user.is_active ? 'text-green-400 bg-green-900/30 border-green-500/30' : 'text-gray-400 bg-gray-900/30 border-gray-500/30'}>
            {user.is_active ? 'Active' : 'Inactive'}
          </Badge>
          {user.is_superuser && <Badge variant="risk">Admin</Badge>}
          {user.is_verified && <Badge variant="evidence">Verified</Badge>}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (user: User) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={<Button variant="ghost" size="sm"><Users className="w-4 h-4" /></Button>}
            onSelect={(value) => {
              if (value === 'edit') setEditingUser(user);
              else if (value === 'toggle') toggleActiveMutation.mutate({ id: user.id, is_active: !user.is_active });
              else if (value === 'delete' && confirm(`Delete user ${user.username}?`)) deleteMutation.mutate(user.id);
            }}
            items={[
              {
                label: 'Edit',
                value: 'edit',
                icon: <Edit className="w-4 h-4" />,
              },
              {
                label: user.is_active ? 'Deactivate' : 'Activate',
                value: 'toggle',
                icon: user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />,
                danger: user.is_active,
              },
              {
                label: 'Delete',
                value: 'delete',
                icon: <Trash2 className="w-4 h-4" />,
                danger: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">Failed to load users</div>
        ) : (
          <>
<Table
               columns={columns as Column<unknown>[]}
               data={data?.items || []}
               keyExtractor={(row) => row.id}
            />
            {data && data.total > 0 && (
              <div className="p-4 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.total)} of {data.total} users
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 10 >= data.total}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create User">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Email" name="email" type="email" required />
            <Input label="Username" name="username" required />
          </div>
          <Input label="Full Name" name="full_name" required />
          <Input label="Password" name="password" type="password" required hint="Min 8 characters" />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <> <Loader2 className="w-4 h-4 animate-spin mr-2" /> Creating... </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
        {editingUser && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Email" name="email" type="email" defaultValue={editingUser.email} required />
              <Input label="Username" name="username" defaultValue={editingUser.username} required />
            </div>
            <Input label="Full Name" name="full_name" defaultValue={editingUser.full_name} required />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_active" defaultChecked={editingUser.is_active} className="rounded" />
                Active
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_verified" defaultChecked={editingUser.is_verified} className="rounded" />
                Verified
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_superuser" defaultChecked={editingUser.is_superuser} className="rounded" />
                Admin
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <> <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving... </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}