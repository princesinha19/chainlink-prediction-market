pragma solidity ^0.6.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/IERC20.sol";

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
        return IERC20(daiToken).balanceOf(address(this));green
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
