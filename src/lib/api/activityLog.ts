import api from '../axios';
import { unwrapRaw, SpringPage } from './http';

export interface ActivityLogDto {
    id: number;
    userId: number | null;
    userName: string | null;
    action: string;
    createdAt: string | null;
}

/** Admin-only audit trail — ADMIN/MANAGER, see ActivityLogController. Paginated (scroll infini) et
 * filtrable par plage de dates (yyyy-MM-dd, bornes incluses) — voir ActivityLogPage. */
export async function listActivityLogs(params: {
    startDate?: string;
    endDate?: string;
    page: number;
    size?: number;
}): Promise<SpringPage<ActivityLogDto>> {
    const { startDate, endDate, page, size = 50 } = params;
    const response = await api.get('/api/admin/activity-logs', { params: { startDate, endDate, page, size } });
    return unwrapRaw<SpringPage<ActivityLogDto>>(response);
}
