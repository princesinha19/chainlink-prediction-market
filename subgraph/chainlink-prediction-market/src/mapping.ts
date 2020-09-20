import { NewGravatar, UpdatedGravatar } from '../generated/Gravity/Gravity'
import { Gravatar } from '../generated/schema'

export function handleNewGravatar(event: NewGravatar): void {
  let gravatar = new Gravatar(event.params.id.toHex())
  gravatar.owner = event.params.owner
  gravatar.displayName = event.params.displayName
  gravatar.imageUrl = event.params.imageUrl
  gravatar.save()
}

export function handleUpdatedGravatar(event: UpdatedGravatar): void {
  let id = event.params.id.toHex()
  let gravatar = Gravatar.load(id)
  if (gravatar == null) {
    gravatar = new Gravatar(id)
  }
  gravatar.owner = event.params.owner
  gravatar.displayName = event.params.displayName
  gravatar.imageUrl = event.params.imageUrl
  gravatar.save()
}

export function handleNewPrediction(event: NewPrediction): void {
  let prediction = new Prediction(event.transaction.hash.toHex() +
    "-" + event.logIndex.toString())
  prediction.predictor = event.params.predictor
  prediction.prediction = event.params.prediction
  prediction.stake = event.params.stake
  prediction.save()

  let predictor = new Predictor(event.params.predictor)
  predictor.address = event.params.predictor
  predictor.activeStake = event.params.stake
}

export function handleAaveLend(event: AaveLend): void {
  let aaveLend = new AaveLend(event.transaction.hash.toHex() +
    "-" + event.logIndex.toString())
  aaveLend.amount = event.params.amount
}

export function handleMarketResolve(event: MarketResolved): void {
  let predictionMarket = new Market(event.transaction.hash.toHex() +
    "-" + event.logIndex.toString())
}

// update the predictor stake
export function handleWithdraw(event: Withdrawn): void {
  let id = event.params.address
  let predictor = Predictor.load(id)
  let oldStake = predictor.activeStake
  predictor.activeStake = oldStake + event.params.activeStake
}
