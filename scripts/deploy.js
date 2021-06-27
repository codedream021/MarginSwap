async function main() {
  const Factory = await ethers.getContractFactory("MarginSwapTestnet");
  const contract = await Factory.deploy();
  console.log("Contract address: " + contract.address)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

