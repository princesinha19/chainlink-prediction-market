import {NewPrediction, AaveLend, MarketResolved, Withdrawn} from '../generated/chainlink prediction market/PredictionMarket'
import {Prediction, Lend, Market, Position, Predictor} from '../generated/schema'

export function handleNewPrediction(event: NewPrediction): void {
  let prediction = new Prediction(event.params.predictor.toHexString()
    .concat('-')
    .concat(event.params.prediction.toHexString())
    .concat('-')
    .concat(event.params.stake.toString()))
  prediction.predictor = event.params.predictor
  prediction.prediction = event.params.prediction
  prediction.stake = event.params.stake
  prediction.save()

  let predictor = new Predictor(event.params.predictor.toHexString())
  predictor.address = event.params.predictor
  predictor.activeStake = event.params.stake
  predictor.save()
}

export function handleAaveLend(event: AaveLend): void {
  let aaveLend = new Lend(event.params.amount.toString())
  aaveLend.amount = event.params.amount
  aaveLend.save()
}

export function handleMarketResolve(event: MarketResolved): void {
  let predictionMarket = new Market(event.transaction.hash.toHex() +
    "-" + event.logIndex.toString())
  predictionMarket.resolveTime = event.params.blockNumber.toString()
  predictionMarket.isResolved = event.params.isResolved.toString()
  predictionMarket.save()
}

// update the predictor stake
export function handleWithdraw(event: Withdrawn): void {
  let id = event.params.withdrawer.toHexString()
  let predictor = Predictor.load(id)
  let oldStake = predictor.activeStake
  predictor.activeStake = oldStake.minus(event.params.amount)
  predictor.save()
}
