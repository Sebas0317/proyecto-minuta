import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUnidades,
  fetchAccesos,
  fetchPaquetes,
  fetchMinuta,
  fetchParqueaderos,
  fetchContextoOperativo,
  createMinutaEntry,
  registrarIngreso,
  registrarSalida,
  createPaquete,
  entregarPaquete,
  notificarPaquete,
} from '../services/api';
import { queryKeys, staleTimes } from './useQueryKeys';

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

export function useContextoOperativoQuery() {
  return useQuery({
    queryKey: queryKeys.contextoOperativo,
    queryFn: fetchContextoOperativo,
    staleTime: staleTimes.contexto,
    refetchInterval: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useUnidadesQuery(params = {}) {
  return useQuery({
    queryKey: queryKeys.unidades(params),
    queryFn: async () => unwrapArray(await fetchUnidades(params)),
    staleTime: staleTimes.unidades,
  });
}

export function useMinutaQuery(params = {}) {
  return useQuery({
    queryKey: queryKeys.minuta(params),
    queryFn: () => fetchMinuta(params),
    staleTime: staleTimes.operativo,
  });
}

export function usePaquetesQuery(params = {}) {
  return useQuery({
    queryKey: queryKeys.paquetes(params),
    queryFn: () => fetchPaquetes(params),
    staleTime: staleTimes.operativo,
  });
}

export function useAccesosQuery(params = {}) {
  return useQuery({
    queryKey: queryKeys.accesos(params),
    queryFn: () => fetchAccesos(params),
    staleTime: staleTimes.operativo,
  });
}

export function useParqueaderosQuery(params = {}) {
  return useQuery({
    queryKey: queryKeys.parqueaderos(params),
    queryFn: async () => unwrapArray(await fetchParqueaderos(params)),
    staleTime: staleTimes.operativo,
  });
}

export function useCondominioMutations() {
  const qc = useQueryClient();

  const invalidateOperativo = () => {
    qc.invalidateQueries({ queryKey: ['minuta'] });
    qc.invalidateQueries({ queryKey: ['paquetes'] });
    qc.invalidateQueries({ queryKey: ['accesos'] });
    qc.invalidateQueries({ queryKey: ['parqueaderos'] });
  };

  const createMinuta = useMutation({
    mutationFn: createMinutaEntry,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['minuta'] }),
  });

  const createAcceso = useMutation({
    mutationFn: registrarIngreso,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accesos'] });
      qc.invalidateQueries({ queryKey: ['parqueaderos'] });
      qc.invalidateQueries({ queryKey: ['minuta'] });
    },
  });

  const closeAcceso = useMutation({
    mutationFn: registrarSalida,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accesos'] });
      qc.invalidateQueries({ queryKey: ['parqueaderos'] });
      qc.invalidateQueries({ queryKey: ['minuta'] });
    },
  });

  const addPaquete = useMutation({
    mutationFn: createPaquete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paquetes'] }),
  });

  const deliverPaquete = useMutation({
    mutationFn: ({ id, data }) => entregarPaquete(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paquetes'] }),
  });

  const notifyPaquete = useMutation({
    mutationFn: notificarPaquete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['paquetes'] }),
  });

  return {
    invalidateOperativo,
    createMinuta,
    createAcceso,
    closeAcceso,
    addPaquete,
    deliverPaquete,
    notifyPaquete,
  };
}
