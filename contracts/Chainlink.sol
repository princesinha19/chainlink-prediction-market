pragma solidity ^0.6.0;

import "https://github.com/smartcontractkit/chainlink/blob/develop/evm-contracts/src/v0.6/ChainlinkClient.sol";

contract APIConsumer is ChainlinkClient {
    bool public isMarketResolved;
    uint256 public predictionResult;

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
    function requestResult(string memory api, string memory path)
        internal
        returns (bytes32 requestId)
    {
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
    function fulfill(bytes32 _requestId, uint256 _data)
        public
        recordChainlinkFulfillment(_requestId)
    {
        predictionResult = _data;

        isMarketResolved = true;
    }
}
