'use strict';

/**
 * Envía respuesta paginada cuando se solicita ?page= o ?paginate=true,
 * manteniendo compatibilidad 100% de arreglo plano cuando no se envía ?page=.
 */
function sendPaginatedOrArray(req, res, items) {
  const list = Array.isArray(items) ? items : [];
  const total = list.length;
  res.setHeader('X-Total-Count', String(total));

  const hasPageParam = req.query.page !== undefined || req.query.paginate === 'true';
  const rawLimit = parseInt(req.query.limit, 10);
  const rawPage = parseInt(req.query.page, 10);

  if (!hasPageParam && isNaN(rawLimit)) {
    return res.json(list);
  }

  const limit = Math.min(200, Math.max(1, isNaN(rawLimit) ? 50 : rawLimit));
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
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
