const PredictionMarket = artifacts.require('./PredictionMarket.sol')

module.exports = async function(deployer) {
  await deployer.deploy(PredictionMarket)
}
