const bcrypt = require("bcrypt");

(async () => {
  const password = "Test@1234";
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
})();