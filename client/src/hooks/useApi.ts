import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/${id}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create user');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useDeleteUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function usePresentations() {
  return useQuery({
    queryKey: ['presentations'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/presentations`);
      if (!res.ok) throw new Error('Failed to fetch presentations');
      return res.json();
    },
  });
}

export function usePresentation(id: number) {
  return useQuery({
    queryKey: ['presentation', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/presentations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch presentation');
      return res.json();
    },
  });
}

export function useCreatePresentation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/presentations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create presentation');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presentations'] });
    },
  });
}

export function useUpdatePresentation(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/presentations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update presentation');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presentations'] });
      qc.invalidateQueries({ queryKey: ['presentation', id] });
    },
  });
}

export function useDeletePresentation(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/presentations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete presentation');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['presentations'] });
    },
  });
}

export function useSlides(presentationId: number) {
  return useQuery({
    queryKey: ['slides', presentationId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/presentations/${presentationId}/slides`);
      if (!res.ok) throw new Error('Failed to fetch slides');
      return res.json();
    },
  });
}

export function useCreateSlide(presentationId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/presentations/${presentationId}/slides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create slide');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slides', presentationId] });
    },
  });
}

export function useUpdateSlide(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/slides/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update slide');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slides'] });
    },
  });
}

export function useDeleteSlide(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/slides/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete slide');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['slides'] });
    },
  });
}
