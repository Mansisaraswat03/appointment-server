export const buildSearchQuery = (queryParams) => {
    const {
      search,
      specialty,
      experience,
      location,
      gender,
      page = 1,
      limit = 10
    } = queryParams;
  
    let query = 'SELECT * FROM doctors WHERE 1=1';
    const params = [];
    let paramCount = 1;
  
    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR specialty ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }
  
    if (specialty) {
      query += ` AND specialty = $${paramCount}`;
      params.push(specialty);
      paramCount++;
    }
  
    if (experience) {
      query += ` AND experience >= $${paramCount}`;
      params.push(experience);
      paramCount++;
    }
  
    if (location) {
      query += ` AND location = $${paramCount}`;
      params.push(location);
      paramCount++;
    }
  
    if (gender) {
      query += ` AND gender = $${paramCount}`;
      params.push(gender);
      paramCount++;
    }
  
    const offset = (page - 1) * limit;
    query += ` ORDER BY id LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);
  
    return { query, params };
  };