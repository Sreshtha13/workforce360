/**
 * Shared OpenAPI components referenced across module docs.
 */

/**
 * @swagger
 * components:
 *   parameters:
 *     PageParam:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *     PageSizeParam:
 *       in: query
 *       name: pageSize
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 25
 *   responses:
 *     Unauthorized:
 *       description: Not authenticated
 *     Forbidden:
 *       description: Insufficient permissions
 *     NotFound:
 *       description: Resource not found
 */
