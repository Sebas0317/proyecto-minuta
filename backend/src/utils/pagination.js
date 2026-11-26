'use strict';

/**
 * Envía respuesta paginada cuando se solicita ?page= o ?paginate=true,
 * manteniendo compatibilidad 100% de arreglo plano cuando no se envía ?page=.
 */
function sendPaginatedOrArray(req, res, items) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  res.setHeader('X-Total-Count', String(total));

  const query = req?.query || {};
  const hasPageParam = query.page !== undefined || query.paginate === 'true';
  const rawLimit = parseInt(query.limit, 10);
  const rawPage = parseInt(query.page, 10);
  const hasValidLimit = !Number.isNaN(rawLimit) && rawLimit > 0;

  if (!hasPageParam && !hasValidLimit) {
    return res.json(list);
  }

  const limit = Math.min(200, hasValidLimit ? rawLimit : 50);
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = list.slice(start, start + limit);

  res.setHeader('X-Total-Pages', String(totalPages));

  if (!hasPageParam) {
    return res.json(data);
  }

  return res.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  });
}

module.exports = { sendPaginatedOrArray };
