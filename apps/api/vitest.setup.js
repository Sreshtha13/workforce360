"use strict";
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
        "postgresql://test:test@localhost:5432/workforce360_test";
process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ??
        "test-jwt-access-secret-minimum-32-characters";
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ??
        "test-jwt-refresh-secret-minimum-32-characters";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.PASSWORD_MIN_LENGTH = "8";
process.env.PASSWORD_REQUIRE_UPPERCASE = "true";
process.env.PASSWORD_REQUIRE_LOWERCASE = "true";
process.env.PASSWORD_REQUIRE_NUMBER = "true";
process.env.PASSWORD_REQUIRE_SPECIAL = "false";
//# sourceMappingURL=vitest.setup.js.map