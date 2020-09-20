pragma solidity ^0.6.0;

import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    /**
     * @dev Returns the amount of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 amount) external returns (bool);

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract AaveClient {
    address daiToken;
    address aDaiToken;
    address lendingPoolAddress;
    address lendingPoolCoreAddress;
    uint256 public  tokenWithInterest;

    constructor() public {
        // DAI Address: 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD
        // ADAI Address: 0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a
        // Lending Pool: 0x580D4Fdc4BF8f9b5ae2fb9225D584fED4AD5375c
        // Lending Pool Core: 0x95D1189Ed88B380E319dF73fF00E479fcc4CFa45

        daiToken = 0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD;
        aDaiToken = 0x58AD4cB396411B691A9AAb6F74545b2C5217FE6a;
        lendingPoolAddress = 0x580D4Fdc4BF8f9b5ae2fb9225D584fED4AD5375c;
        lendingPoolCoreAddress = 0x95D1189Ed88B380E319dF73fF00E479fcc4CFa45;
    }

    receive() external payable {}

    function getLendingRate() public view returns (uint256) {
        return
            IAaveLendingPoolCore(lendingPoolCoreAddress)
                .getReserveCurrentLiquidityRate(daiToken);
    }

    function getBorrowRate() public view returns (uint256) {
        return
            IAaveLendingPoolCore(lendingPoolCoreAddress)
                .getReserveCurrentStableBorrowRate(daiToken);
    }

    function depositToken(uint256 amount) internal {
        // Approve LendingPool contract to move your DAI
        IERC20(daiToken).approve(lendingPoolCoreAddress, amount);

        // Deposit Token to lending pool
        IAaveLendingPool(lendingPoolAddress).deposit(daiToken, amount, 0);
    }

    function withdrawAToken() internal {
        uint256 amount = getATokenBalance();
        tokenWithInterest = amount;

        // Withdraaw Token for lending pool
        IAToken(aDaiToken).redeem(amount);
    }

    function getATokenBalance() public view returns (uint256) {
        (uint256 balance, , , , , , , , , ) = IAaveLendingPool(
            lendingPoolAddress
        )
            .getUserReserveData(daiToken, address(this));

        return balance;
    }

    function getDAIBalance() public view returns (uint256) {
        return IERC20(daiToken).balanceOf(address(this));
    }
}

interface IAaveLendingPool {
    function deposit(
        address _reserve,
        uint256 _amount,
        uint16 _referralCode
    ) external;

    function getUserReserveData(address _reserve, address _user)
        external
        view
        returns (
            uint256 currentATokenBalance,
            uint256 currentBorrowBalance,
            uint256 principalBorrowBalance,
            uint256 borrowRateMode,
            uint256 borrowRate,
            uint256 liquidityRate,
            uint256 originationFee,
            uint256 variableBorrowIndex,
            uint256 lastUpdateTimestamp,
            bool usageAsCollateralEnabled
        );
}

interface IAaveLendingPoolCore {
    function getReserveCurrentLiquidityRate(address _reserve)
        external
        view
        returns (uint256);

    function getReserveCurrentStableBorrowRate(address _reserve)
        external
        view
        returns (uint256);
}

interface IAToken {
    function redeem(uint256 _amount) external;
}

contract APIConsumer is ChainlinkClient {
    bytes32 public predictionResult;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    /**
     * Network: Kovan
     * Oracle: Chainlink - 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
     * Job ID: Chainlink - 29fa9aa13bf1468788b7cc4a500a45b8
     * Fee: 1 LINK
     */
    constructor() public {
        setPublicChainlinkToken();
        oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        jobId = "29fa9aa13bf1468788b7cc4a500a45b8";
        fee = 1e18;
    }

    /**
     * Create a Chainlink request to retrieve API response, find the target price
     */
    function requestResult(
        string memory api,
        string memory path
    ) internal returns (bytes32 requestId) {
        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );

        // Set the URL to perform the GET request on
        // api= https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD
        request.add("get", api);

        // Set the path to find the desired data in the API response
        request.add("path", path);

        // Sends the request
        return sendChainlinkRequestTo(oracle, request, fee);
    }

    /**
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, bytes32 _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        predictionResult = _data;
    }
}

contract PredictionMarket is AaveClient, APIConsumer {
    address public token;
    string public question;
    bytes32[] public options;
    uint8 public optionsCount;
    bool public isLessRisky;
    string resultApi;
    string resultPath;
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

        // Deposit all staked asset to Aave
        depositToken(totalAmountStaked);
        emit AaveLend(totalAmountStaked);
    }

    function resolveMarket() public {
        require(
            block.timestamp >= marketCloseTimestamp,
            "Can't resolve market before deadline !!"
        );
        require(!isMarketResolved, "Marker already resolved !!");

        isMarketResolved = true;

        // Withdraw all staked asset from Aave
        withdrawAToken();

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
