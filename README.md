## Chainlink Prediction Market
This Prediction markets leverage chainlink fo secure market resolution and Aave lending protocol to earn interest. This interest is paid out to the winner position holders at the time of market resolution.

#### Working Application Link
https://princesinha19.github.io/chainlink-prediction-market/

## Demo (Video)
[![youtube_video](https://img.youtube.com/vi/CUR0ROiCmQo/0.jpg)](https://youtu.be/CUR0ROiCmQo) 
<br> 

## Steps to Run:-
1. Clone the repository
2. Go inside the cloned project (chainlink-prediction-marker)
3. Install the dependency using command `yarn install:dependency`
4. Run command `yarn start`, to start the application

## What it does:-

Conditional prediction market where the user can take multiple positions. All of the staked amounts are pooled and lent on Aave protocol to earn interest for the duration of the market. The markets are securely resolved by the chainlink oracle. The source of the data is trusted, transparent, and known.

  ### Currently, There are two types of markets available:-

1. **Normal Market (High Risk)**

    It's a market where correct predictors will get rewards proportional to their stake plus the interest earned from the Aave lending protocol. And, incorrect predictors will lose their stake.

2. **No Loss Market (Less Risk)**

    Here the interest earned from the Aave lending pool will only be distributed among the correct/winning predictors. So, It's is a less risky market as even an incorrect/losing predictor will get their stake back.

  ### We also have two types of market outcomes:-

1. **Conditional Outcomes:** Here one can predict only "YES or NO", based on condition.

    For eg. Will the price of ETH go above $500? 
    Here, there will be only two options **YES** (For predicting that it will go above $500) and **NO** (For predicting that it will not go above $500).

2. **Strict Outcomes:** Here one has to predict exact value. For example:

    **Q.** **Who will win the 2020 U.S. Presidential election?**

    1. Joe Biden
    2. Donald Trump

    At the time of the market resolution (sometime in the future), the data is fetched from the chainlink oracles and the market is resolved with the correct results. These results are fetched from a trusted source.

## How we built it:-

We have implemented prediction markets in solidity and deployed the contracts on the Kovan testnet. We make use of chainlink and Aave in our contracts. We are using Chainlink oracles to fetch external data to resolve the market. We believe that Oracle is the only secure way to fetch data into a smart contract. 

We are using Aave for maximizing the profits of the users. The user can stake for a limited time span after that the funds are deposited in the Aave lending pool where it earns interest until the market is resolved. At the time of market resolution, the funds are withdrawn from the market to the smart contract. The eligible users can then withdraw their respective rewards anytime they want.

Once the market reaches the market close timestamp, the system automatically displays the resolve market button. On the click of the button, all the funds from Aave get withdrawn and get deposited to the market contract. At the same time, the smart contract calls the chainlink function to get the market result. In few seconds chainlink provides the result and the market gets resolved.

We are using The Graph protocol, to visualize market data like predictions, stake, and market resolution results. This data can be analyzed by the user for risk assessment or due diligence. The subgraph can also be used as an oracle for other markets to supply useful data but such use cases are not explored in this project. 

The subgraph is deployed on kovan:
[https://thegraph.com/explorer/subgraph/ayushkaul/chainlink-prediction-market](https://thegraph.com/explorer/subgraph/ayushkaul/chainlink-prediction-market)

## Steps To Use:-

1. You have to connect Metamask and choose the network as Kovan. The system will show all the available markets. It will display both No Loss and Normal prediction markets. One can also see if the market is already closed.
2. You can click on any market and the system will direct on the market page. On that page, one can see all the details of the market.
3. You can create your position by clicking `Want to Predict` button. You have to choose the outcome and need to fill the stake amount, We only support DAI for now. 
4. The system will show you metamask pop-up to approve the token. It will call ERC20 to approve the function.
5. After approving, you will get another metamask popup to sign the `submit prediction` transaction.
6. You can see the result once the market gets resolved at the market close timestamp. If you have any position in the market and made a correct prediction, You can click to `claim reward` button. 
For the No Loss market, also the incorrect predictor will get the button `Get Stake` to get their stake back.
