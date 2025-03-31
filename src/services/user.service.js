import pool from "../config/database.js";

export const userService = {
  async getAllUsers(filters = {}) {
    const client = await pool.connect();
    try {
      let query = `
        SELECT 
          id,
          name,
          email,
          profile,
          role,
          fcm_token
        FROM users
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      if (filters.role) {
        query += ` AND role = $${paramCount}`;
        params.push(filters.role);
        paramCount++;
      }

      if (filters.search) {
        query += ` AND (
          name ILIKE $${paramCount} OR 
          email ILIKE $${paramCount}
        )`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const offset = (page - 1) * limit;

      const countQuery = query.replace('SELECT id, name, email', 'SELECT COUNT(*)');
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);

      query += `LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      return {
        users: result.rows,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } finally {
      client.release();
    }
  }
};