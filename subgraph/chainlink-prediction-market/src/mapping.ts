// import { NewGravatar, UpdatedGravatar } from '../generated/Gravity/Gravity'
// import { Gravatar } from '../generated/schema'
import {NewPrediction, AaveLend, MarketResolved, Withdrawn} from '../generated/chainlink prediction market/PredictionMarket'
import {Prediction, Lend, Market, Position, Predictor} from '../generated/schema'

export function handleNewPrediction(event: NewPrediction): void {
  let prediction = new Prediction(event.params.predictor.toString() +
    '-' + event.params.prediction.toString()+ '-' +
    event.params.stake.toString())
  prediction.predictor = event.params.predictor
  prediction.prediction = event.params.prediction
  prediction.stake = event.params.stake
  prediction.save()

  let predictor = new Predictor(event.params.predictor.toString())
  predictor.address = event.params.predictor
  predictor.activeStake = event.params.stake
}

export function handleAaveLend(event: AaveLend): void {
  let aaveLend = new Lend(event.params.amount.toString())
  aaveLend.amount = event.params.amount
}

export function handleMarketResolve(event: MarketResolved): void {
  let predictionMarket = new Market(event.transaction.hash.toHex() +
    "-" + event.logIndex.toString())
}

// update the predictor stake
export function handleWithdraw(event: Withdrawn): void {
  let id = event.params.withdrawer.toString()
  let predictor = Predictor.load(id)
  let oldStake = predictor.activeStake
  predictor.activeStake = oldStake.minus(event.params.amount)
}
