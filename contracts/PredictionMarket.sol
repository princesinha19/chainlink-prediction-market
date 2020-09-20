pragma solidity ^0.6.0;

import "./Chainlink.sol";
import "./AaveClient.sol";
import "./interfaces/IERC20.sol";

contract PredictionMarket is AaveClient, APIConsumer {
    address public token;
    string public question;
    bytes32[] public options;
    uint8 public optionsCount;
    bool public isLessRisky;
    string resultApi;
    string resultPath;
    bool isStakedOnAave;
    bool public isMarketResolved;
    uint256 public marketCloseTimestamp;
    uint256 public predictionCloseTimestamp;
    uint256 public totalAmountStaked;

    // events
    event NewPrediction(address, bytes32, uint256);
    event AaveLend(uint256);
    event MarketResolved(uint256, bool);
    event Withdrawn(address, uint256);

    // Maps all the prediction made
    mapping(address => bytes32) public prediction;

    // User amount staked for prediction
    mapping(address => uint256) public amountStaked;

    // mapping of withdrawn
    mapping(address => bool) public isAlreadyWithdrawn;

    // keeps staked amount for each uinque prediction
    mapping(bytes32 => uint256) public uniquePredictionValue;

    constructor(
        address _token,
        bool _isLessRisky,
        string memory _question,
        bytes32[] memory _options,
        uint8 _optionsCount,
        string memory _resultApi,
        string memory _resultPath,
        uint256 _marketCloseTimestamp,
        uint256 _predictionCloseTimestamp
    ) public {
        token = _token;
        question = _question;
        options = _options;
        resultApi = _resultApi;
        resultPath = _resultPath;
        isLessRisky = _isLessRisky;
        optionsCount = _optionsCount;
        marketCloseTimestamp = _marketCloseTimestamp;
        predictionCloseTimestamp = _predictionCloseTimestamp;
    }

    function makePrediction(bytes32 _prediction, uint256 _stakeAmount) public {
        require(
            block.timestamp <= predictionCloseTimestamp,
            "Prediction making deadline is over !!"
        );
        require(
            prediction[msg.sender] == bytes32(0),
            "You have already made a prediction !!"
        );
        require(
            IERC20(token).transferFrom(msg.sender, address(this), _stakeAmount)
        );

        // add the stake to the option
        prediction[msg.sender] = _prediction;

        amountStaked[msg.sender] = _stakeAmount;
        uniquePredictionValue[_prediction] += _stakeAmount;

        totalAmountStaked += _stakeAmount;
        emit NewPrediction(msg.sender, _prediction, _stakeAmount);
    }

    function AavelendOnAave() public {
        require(
            block.timestamp >= predictionCloseTimestamp,
            "Can't Aavelend before all prediction !!"
        );

        if (totalAmountStaked > 0) {
            // Deposit all staked asset to Aave
            depositToken(totalAmountStaked);
            isStakedOnAave = true;
        }
    }

    function resolveMarket() public {
        require(
            block.timestamp >= marketCloseTimestamp,
            "Can't resolve market before deadline !!"
        );
        require(!isMarketResolved, "Marker already resolved !!");

        isMarketResolved = true;

        if (isStakedOnAave) {
            // Withdraw all staked asset from Aave
            withdrawAToken();
        }

        // Call Chainlink Request data function
        requestResult(resultApi, resultPath);
        emit MarketResolved(block.number, true);
    }

    function withdrawReward() public {
        require(isMarketResolved, "Market does not resolved yet !!");
        require(
            !isAlreadyWithdrawn[msg.sender],
            "You have already withdrawn your reward"
        );

        if (!isLessRisky) {
            if (prediction[msg.sender] == predictionResult) {
                uint256 ratio = amountStaked[msg.sender] /
                    uniquePredictionValue[predictionResult];

                uint256 _transferAmount = ratio * tokenWithInterest;

                isAlreadyWithdrawn[msg.sender] = true;

                IERC20(token).transfer(msg.sender, _transferAmount);
                emit Withdrawn(msg.sender, _transferAmount);
            }
        } else {
            uint256 transferAmount = amountStaked[msg.sender];

            if (prediction[msg.sender] == predictionResult) {
                uint256 ratio = amountStaked[msg.sender] /
                    uniquePredictionValue[predictionResult];

                uint256 reward = ratio *
                    (tokenWithInterest - totalAmountStaked);
                transferAmount += reward;
            }

            isAlreadyWithdrawn[msg.sender] = true;
            emit Withdrawn(msg.sender, transferAmount);
            IERC20(token).transfer(msg.sender, transferAmount);
        }
    }

    function getRewardAmount(address _address) public view returns (uint256) {
        if (!isLessRisky) {
            if (prediction[_address] == predictionResult) {
                uint256 ratio = amountStaked[_address] /
                    uniquePredictionValue[predictionResult];

                uint256 totalAmount = ratio * tokenWithInterest;

                return totalAmount;
            } else {
                return 0;
            }
        } else {
            uint256 transferAmount = amountStaked[_address];

            if (prediction[_address] == predictionResult) {
                uint256 ratio = amountStaked[_address] /
                    uniquePredictionValue[predictionResult];

                uint256 reward = ratio *
                    (tokenWithInterest - totalAmountStaked);

                transferAmount += reward;
            }

            return transferAmount;
        }
    }
}
