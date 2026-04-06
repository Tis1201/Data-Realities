import { json, type RequestHandler } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import { errorHandler } from '$lib/server/errors/errorHandler';
import { areDevicesOnline } from '$lib/server/device/devicePresence';

const deviceSelect = {
  id: true,
  name: true,
  model: true,
  status: true,
  description: true,
  createdAt: true,
  lastUsedAt: true,
  connected: true
} satisfies Prisma.DeviceSelect;

type DeviceListItem = Prisma.DeviceGetPayload<{ select: typeof deviceSelect }>;

export const GET: RequestHandler = async ({ url, locals }) => {
  try {
    // Get authenticated user
    const auth = await locals.auth.validate();
    if (!auth?.user) {
      return json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const perPage = parseInt(url.searchParams.get('per_page') || '5', 10);
    const sort = url.searchParams.get('sort') || 'name';
    const order = (url.searchParams.get('order') || 'asc') as 'asc' | 'desc';
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';

    // Build where clause
    const where: Prisma.DeviceWhereInput = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await locals.prisma.device.count({ where });

    // Calculate pagination
    const totalPages = Math.ceil(total / perPage);
    const skip = (page - 1) * perPage;

    // Get devices
    const devices: DeviceListItem[] = await locals.prisma.device.findMany({
      where,
      select: deviceSelect,
      orderBy: { [sort]: order } as Prisma.DeviceOrderByWithRelationInput,
      skip,
      take: perPage
    });

    // Batch check all device online statuses at once (much faster than sequential calls)
    const deviceIds = devices.map((d) => d.id);
    const onlineStatusMap = await areDevicesOnline(deviceIds);
    
    // Update online status from Redis (real-time presence tracking via pushpin-tracker)
    const devicesWithRealTimeStatus = devices.map((device) => {
      const isOnline = onlineStatusMap.get(device.id) ?? false;
      return {
        ...device,
        connected: isOnline  // Override DB value with real-time Redis status
      };
    });

    return json({
      success: true,
      devices: devicesWithRealTimeStatus,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: totalPages
      }
    });

  } catch (err) {
    return errorHandler(err);
  }
};
