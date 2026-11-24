import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../hooks/useQueryKeys';
import { fetchSecurityEvents, fetchUsers } from '../services/api';
import SecurityDashboard from './SecurityDashboard';

export default function SecurityView() {
  const { data: secEvents } = useQuery({
    queryKey: queryKeys.securityEvents,
    queryFn: () => fetchSecurityEvents(200),
    staleTime: 1000 * 60,
  });

  const { data: secUsers } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => fetchUsers(),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <SecurityDashboard
      events={Array.isArray(secEvents) ? secEvents : []}
      users={Array.isArray(secUsers) ? secUsers : []}
    />
  );
}
