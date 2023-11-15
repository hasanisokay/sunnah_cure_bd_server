require("dotenv/config");
const bcrypt = require("bcrypt");

// const saltRounds = 10; // Adjust this as needed

// // When a user registers
// const plaintextPassword = "!sukun123#@"; 
// bcrypt.hash(plaintextPassword, saltRounds, (err, hash) => {
//   if (err) {
//     // Handle error
//   } else {
//     console.log(hash);
//   }
// });



const plaintextPassword = '!sukun123#@'; // Replace with the actual user input
console.log(process.env.ADMIN_PASS);
bcrypt.compare(plaintextPassword, process.env.ADMIN_PASS, (err, result) => {
  if (err) {
    console.log(err);
  } 
  if (result) {
console.log("object");
  }
});