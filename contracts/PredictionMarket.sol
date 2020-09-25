pragma solidity ^0.6.0;

import "./Chainlink.sol";
import "./AaveClient.sol";
import "./interfaces/IERC20.sol";

contract PredictionMarket is AaveClient, APIConsumer {
    address public token;
    string public question;
    uint256[] public options;
    uint8 public optionsCount;
    bool public isLessRisky;
    string public resultApi;
    string public resultPath;
    bool public isStakedOnAave;
    uint256 public marketCloseTimestamp;
    uint256 public predictionCloseTimestamp;
    uint256 public totalAmountStaked;
    bool public isConditionalMarket;
    string public conditionType;
    uint256 public conditionValue;

    // events
    event NewPrediction(address, uint256, uint256);
    event AaveLend(uint256);
    event MarketResolved(uint256, bool);
    event Withdrawn(address, uint256);

    // Maps all the prediction made
    mapping(address => uint256) public prediction;

    // User amount staked for prediction
    mapping(address => uint256) public amountStaked;

    // mapping of withdrawn
    mapping(address => bool) public isAlreadyWithdrawn;

    // keeps staked amount for each uinque prediction
    mapping(uint256 => uint256) public uniquePredictionValue;

    constructor(
        address _token,
        bool _isLessRisky,
        string memory _question,
        uint256[] memory _options,
        uint8 _optionsCount,
        string memory _resultApi,
        string memory _resultPath,
        uint256 _marketCloseTimestamp,
        uint256 _predictionCloseTimestamp,
        bool _isConditionalMarket,
        string memory _conditionType,
        uint256 _conditionValue
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
        isConditionalMarket = _isConditionalMarket;

        if (_isConditionalMarket) {
            conditionType = _conditionType;
            conditionValue = _conditionValue;
        }
    }

    function makePrediction(uint256 _prediction, uint256 _stakeAmount) public {
        require(
            block.timestamp <= predictionCloseTimestamp,
            "Prediction making deadline is over !!"
        );
        require(
            prediction[msg.sender] == 0,
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

    function lendOnAave() public {
        require(
            block.timestamp >= predictionCloseTimestamp,
            "Can't lend before all prediction !!"
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

        uint256 marketResult = predictionResult;

        if (isConditionalMarket) {
            marketResult = getConditionalMarketResult() == true ? 100 : 1;
        }

        if (!isLessRisky) {
            if (prediction[msg.sender] == marketResult) {
                uint256 ratio = amountStaked[msg.sender] /
                    uniquePredictionValue[marketResult];

                uint256 _transferAmount = ratio * tokenWithInterest;

                isAlreadyWithdrawn[msg.sender] = true;

                IERC20(token).transfer(msg.sender, _transferAmount);
                emit Withdrawn(msg.sender, _transferAmount);
            }
        } else {
            uint256 transferAmount = amountStaked[msg.sender];

            if (prediction[msg.sender] == marketResult) {
                uint256 ratio = amountStaked[msg.sender] /
                    uniquePredictionValue[marketResult];

                uint256 reward = ratio *
                    (tokenWithInterest - totalAmountStaked);
                transferAmount += reward;
            }

            isAlreadyWithdrawn[msg.sender] = true;
            emit Withdrawn(msg.sender, transferAmount);
            IERC20(token).transfer(msg.sender, transferAmount);
        }
    }

    function getConditionalMarketResult() public view returns (bool) {
        require(isMarketResolved, "Result doesn't came yet !!");
        require(isConditionalMarket, "Market is not conditional !!");

        bool result;

        if (
            keccak256(abi.encodePacked(conditionType)) ==
            keccak256(abi.encodePacked("above")) &&
            predictionResult > conditionValue
        ) {
            result = true;
        }

        if (
            keccak256(abi.encodePacked(conditionType)) ==
            keccak256(abi.encodePacked("below")) &&
            predictionResult < conditionValue
        ) {
            result = true;
        }

        return result;
    }

    function getRewardAmount(address _address) public view returns (uint256) {
        uint256 marketResult = predictionResult;

        if (isConditionalMarket) {
            marketResult = getConditionalMarketResult() == true ? 100 : 1;
        }

        if (!isLessRisky) {
            if (prediction[_address] == marketResult) {
                uint256 ratio = amountStaked[_address] /
                    uniquePredictionValue[marketResult];

                uint256 totalAmount = ratio * tokenWithInterest;

                return totalAmount;
            } else {
                return 0;
            }
        } else {
            uint256 transferAmount = amountStaked[_address];

            if (prediction[_address] == marketResult) {
                uint256 ratio = amountStaked[_address] /
                    uniquePredictionValue[marketResult];

                uint256 reward = ratio *
                    (tokenWithInterest - totalAmountStaked);

                transferAmount += reward;
            }

            return transferAmount;
        }
    }
}
