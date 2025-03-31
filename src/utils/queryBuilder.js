export const buildSearchQuery = (queryParams) => {
  const {
    search,
    experience,
    gender,
    rating,
    page = 1,
    limit = 6
  } = queryParams;

  let query = `
    SELECT 
      d.*,
      u.name,
      u.profile
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramCount = 1;

  if (search) {
    query += ` AND (
      u.name ILIKE $${paramCount} OR 
      d.specialty ILIKE $${paramCount} OR 
      d.qualification ILIKE $${paramCount} OR 
      d.location ILIKE $${paramCount}
    )`;
    params.push(`%${search}%`);
    paramCount++;
  }

  if (experience) {
    if (experience.includes('-')) {
      const [minExp, maxExp] = experience.split('-').map(Number);
      query += ` AND d.experience >= $${paramCount} AND d.experience <= $${paramCount + 1}`;
      params.push(minExp, maxExp);
      paramCount += 2;
    } else {
      const minExp = Number(experience);
      query += ` AND d.experience >= $${paramCount}`;
      params.push(minExp);
      paramCount++;
    }
  }

  if (gender) {
    query += ` AND d.gender = $${paramCount}`;
    params.push(gender);
    paramCount++;
  }

  if (rating) {
    query += ` AND d.rating >= $${paramCount}`;
    params.push(Number(rating));
    paramCount++;
  }

  const offset = (page - 1) * limit;
  query += ` ORDER BY d.id LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  params.push(limit, offset);

  return { query, params };
};