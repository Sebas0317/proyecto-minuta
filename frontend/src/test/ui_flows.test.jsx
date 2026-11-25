import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminShell from '../components/AdminShell';
import MinutaView from '../components/MinutaView';
import {
  clearOfflineQueue,
  enqueueOfflineMutation,
  flushOfflineQueue,
  getOfflineQueue,
} from '../services/offlineQueue';
import { getLocalDateISO } from '../services/api';

function renderWithProviders(ui, initialEntries = ['/admin']) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Flujos Críticos UI, RBAC Visual, Paginación y Cola Offline', () => {
  beforeEach(async () => {
    await clearOfflineQueue();
    vi.restoreAllMocks();
  });

  it('getLocalDateISO retorna formato YYYY-MM-DD en calendario local sin desfase UTC', () => {
    const sample = new Date(2026, 10, 24, 21, 30, 0); // 9:30 PM local
    expect(getLocalDateISO(sample)).toBe('2026-11-24');
  });

  it('Cola Offline persiste mutaciones de garita y las sincroniza al reconectar', async () => {
    await enqueueOfflineMutation({
      endpoint: '/minuta',
      method: 'POST',
      body: { tipo: 'ronda', descripcion: 'Ronda durante caída de internet' },
      label: 'Minuta Offline',
    });

    const pending = await getOfflineQueue();
    expect(pending).toHaveLength(1);
    expect(pending[0].endpoint).toBe('/minuta');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 'min-synced-1' }),
    });

    const result = await flushOfflineQueue('/v1');
    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('AdminShell aplica RBAC visual ocultando módulos administrativos al rol guarda', () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AdminShell rol="guarda" onSalir={() => {}} />}>
          <Route index element={<div>Vista Operativa</div>} />
        </Route>
      </Routes>
    );

    expect(screen.getAllByText('Tablero Operativo').length).toBeGreaterThan(0);
    expect(screen.getByText('Minuta Digital')).toBeInTheDocument();
    expect(screen.queryByText('Personal y Guardas')).not.toBeInTheDocument();
    expect(screen.queryByText('Ciberseguridad & Logs')).not.toBeInTheDocument();
  });

  it('AdminShell muestra módulos completos para rol admin', () => {
    renderWithProviders(
      <Routes>
        <Route path="/admin" element={<AdminShell rol="admin" onSalir={() => {}} />}>
          <Route index element={<div>Vista Admin</div>} />
        </Route>
      </Routes>
    );

    expect(screen.getByText('Personal y Guardas')).toBeInTheDocument();
    expect(screen.getByText('Ciberseguridad & Logs')).toBeInTheDocument();
  });

  it('MinutaView renderiza respuesta paginada del servidor y permite cambiar de página', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const isPage2 = String(url).includes('page=2');
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            data: [
              {
                id: isPage2 ? 'min-p2' : 'min-p1',
                fecha: '2026-11-25T12:00:00.000Z',
                tipo: 'ronda',
                titulo: isPage2 ? 'Ronda Página 2' : 'Ronda Página 1',
                descripcion: 'Recorrido perimetral verificado',
                severidad: 'info',
                guarda: 'Carlos Méndez',
              },
            ],
            pagination: {
              page: isPage2 ? 2 : 1,
              limit: 20,
              total: 35,
              totalPages: 2,
              hasMore: !isPage2,
            },
          }),
      };
    });

    renderWithProviders(<MinutaView />, ['/admin/minuta']);

    await waitFor(() => {
      expect(screen.getByText('Ronda Página 1')).toBeInTheDocument();
    });

    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Ronda Página 2')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
