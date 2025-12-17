// Migration script for deploying the counter program
// This file is executed when running `anchor migrate`

const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Add your deploy script here.
  console.log("Migration complete!");
};
