import bcrypt from 'bcryptjs';

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) console.error(err);
  console.log(`Hash for '${password}': ${hash}`);
});
