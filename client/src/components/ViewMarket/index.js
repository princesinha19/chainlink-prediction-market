import React, { useState, useEffect } from "react";
import {
    Row,
    Button,
    Card,
    Col,
    Form,
    Table,
    Dropdown, DropdownButton
} from "react-bootstrap";

import { ethers } from 'ethers';
import AlertModal from "../Utils/AlertModal";
import SuccessModal from "../Utils/SuccessModal";
import Loading from "../Utils/Loading";
import pmAbi from "../../utils/pmAbi.json";
import erc20Abi from "../../utils/erc20Abi.json";
import { useParams } from "react-router-dom";
import history from "../Utils/History";

export default function ViewMarket() {
    let routes;

    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });

    const [successModal, setSuccessModal] = useState({
        msg: "",
        open: false
    });

    const [details, setDetails] = useState({
        prediction: "",
        amount: "",
    });

    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isLending, setIsLending] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isMakingPrediction, setIsMakingPrediction] = useState(false);
    const [showMakePrediction, setShowMakePrediction] = useState(false);
    const [provider, setProvider] = useState("");
    const [contractInstance, setContractInstance] = useState("");
    const { pmContractAddress } = useParams();
    const daiContractAddress = "0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD";
    const zeroBytes = "0x0000000000000000000000000000000000000000000000000000000000000000";

    const [state, setState] = useState({
        totalAmountStaked: "",
        question: "",
        resultApi: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
        predictionCloseTimestamp: "",
        marketCloseTimestamp: "",
        isLessRisky: false,
        outcomes: [],
        predictionResult: "",
        isMarketResolved: false,
        isAlreadyWithdrawn: false,
        rewardAmount: "",
        isStakedOnAave: false,
    });

    const [addressPredictions] = useState([]);

    const getMarketData = async () => {
        const web3 = window.ethereum;
        await web3.enable();
        const currentProvider = new ethers.providers.Web3Provider(web3);
        const signer = currentProvider.getSigner();
        const signerAddress = await signer.getAddress();

        const contract = new ethers.Contract(
            pmContractAddress,
            pmAbi,
            signer,
        );

        setProvider(currentProvider);
        setContractInstance(contract);

        const question = await contract.question();
        // const resultApi = await contract.resultApi();
        const isLessRisky = await contract.isLessRisky();
        const outcomeCount = await contract.optionsCount();
        const totalAmountStaked = await contract.totalAmountStaked();
        const marketCloseTimestamp = await contract.marketCloseTimestamp();
        const predictionCloseTimestamp = await contract.predictionCloseTimestamp();

        let outcomes = [];
        for (let i = 0; i < outcomeCount; i++) {
            const prediction = await contract.options(i);
            const predictionValue = await contract.uniquePredictionValue(prediction);

            outcomes.push({
                outcome: prediction,
                amountStaked: ethers.utils.formatEther(predictionValue),
            });
        }

        let addressStake;
        const addressPrediction = await contract.prediction(signerAddress);
        if (addressPrediction !== zeroBytes) {
            addressStake = ethers.utils.formatEther(
                await contract.amountStaked(signer.getAddress())
            );
        }

        addressPredictions.push({
            prediction: addressPrediction,
            stakeAmount: addressStake,
        });

        let predictionResult, isMarketResolved, isAlreadyWithdrawn, rewardAmount;
        if (currentUnixTime() > Number(marketCloseTimestamp)) {
            predictionResult = await contract.predictionResult();
            isMarketResolved = await contract.isMarketResolved();
            isAlreadyWithdrawn = await contract.isAlreadyWithdrawn(signerAddress);
            rewardAmount = ethers.utils.formatEther(
                await contract.getRewardAmount(signerAddress)
            );
        }

        let isStakedOnAave;
        if (currentUnixTime() > Number(predictionCloseTimestamp)) {
            isStakedOnAave = await contract.isStakedOnAave();
        }

        setState({
            ...state,
            question,
            isLessRisky,
            outcomes,
            totalAmountStaked: ethers.utils.formatEther(totalAmountStaked),
            marketCloseTimestamp: Number(marketCloseTimestamp),
            predictionCloseTimestamp: Number(predictionCloseTimestamp),
            predictionResult: predictionResult,
            isMarketResolved,
            isAlreadyWithdrawn,
            rewardAmount,
            isStakedOnAave,
        });

        setLoading(false);
    }

    const approveDai = async (amount) => {
        try {
            const erc20 = new ethers.Contract(
                daiContractAddress,
                erc20Abi,
                provider.getSigner(),
            );

            setIsApproving(true);

            const tx = await erc20.approve(pmContractAddress, amount);

            await provider.waitForTransaction(tx.hash);

            setIsApproving(false);
        } catch {
            setIsApproving(false);
        }
    }

    const makePrediction = async () => {
        try {
            const amount = Number(
                ethers.utils.parseEther(details.amount)
            ).toString(10);

            // Approve DAI
            await approveDai(amount);

            setIsMakingPrediction(true);

            const tx = await contractInstance.makePrediction(
                details.prediction,
                amount,
            );

            await provider.waitForTransaction(tx.hash);

            setIsMakingPrediction(false);

            setSuccessModal({
                open: true,
                msg: "Congratulations !! " +
                    "Your have succesfully made your prediction !!",
            });
        } catch (error) {
            setIsMakingPrediction(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const lendOnAave = async () => {
        try {
            const tx = await contractInstance.lendOnAave();

            setIsLending(true);
            await provider.waitForTransaction(tx.hash);

            setIsLending(false);
        } catch (error) {
            setIsLending(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const resolveMarket = async () => {
        try {
            const tx = await contractInstance.resolveMarket();

            setIsResolving(true);
            await provider.waitForTransaction(tx.hash);

            setIsResolving(false);
        } catch (error) {
            setIsResolving(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const getReward = async () => {
        try {
            setIsProcessing(true);

            const tx = await contractInstance.withdrawReward();

            await provider.waitForTransaction(tx.hash);

            setIsProcessing(false);

            setSuccessModal({
                open: true,
                msg: "Congratulations !! " +
                    "Your have succesfully recieved your reward !!",
            });
        } catch (error) {
            setIsProcessing(false);
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const currentUnixTime = () => {
        return Math.floor((new Date()).getTime() / 1000);
    }

    const getISOString = (unixTimestamp) => {
        const tempTime = new Date(unixTimestamp * 1000)
            .toISOString()
            .replace('Z', ' ')
            .replace('T', ' ');

        const index = tempTime.indexOf('.');

        return tempTime.substring(0, index) + ' UTC';
    }

    const handleReload = () => {
        history.go(0);
    }

    useEffect(() => {
        if (state.totalAmountStaked === "") {
            getMarketData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        routes = <Loading />;
    } else {
        routes = (
            <div style={{ width: "100%", marginBottom: "70px" }}>
                <Card className="mx-auto form-card ">
                    <Card.Body style={{ textAlign: "left" }}>
                        <p style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "1.5rem",
                            marginBottom: "30px"
                        }}>
                            <u>{state.question}</u>
                        </p>

                        <Row style={{ paddingBottom: "20px" }}>
                            <Col>
                                <u style={{ fontWeight: "bold" }}>Prediction Close</u>
                                <span className="float-right">
                                    {getISOString(state.predictionCloseTimestamp)}
                                </span>
                            </Col>

                            <Col>
                                <u style={{ fontWeight: "bold" }}>Market Close</u>
                                <span className="float-right">
                                    {getISOString(state.marketCloseTimestamp)}
                                </span>
                            </Col>
                        </Row>

                        <Row style={{ paddingBottom: "30px" }}>
                            <Col>
                                <u style={{ fontWeight: "bold" }}>Total Staked</u>
                                <span className="float-right">{state.totalAmountStaked} DAI</span>
                            </Col>

                            <Col>
                                <u style={{ fontWeight: "bold" }}>Market Type</u>
                                <span className="float-right">
                                    {!state.isLessRisky ?
                                        <strong>Normal Market</strong>
                                        :
                                        <strong>No Loss Market</strong>
                                    }
                                </span>
                            </Col>
                        </Row>

                        <Row style={{ paddingBottom: "10px", textAlign: "center" }}>
                            <Col>
                                {currentUnixTime() > Number(state.predictionCloseTimestamp) ?
                                    <span><strong>Result API: </strong></span>
                                    :
                                    null
                                }
                                <a href={state.resultApi} target="_blank" rel="noopener noreferrer">
                                    <span> {state.resultApi}</span>
                                </a>
                            </Col>
                        </Row>

                        {currentUnixTime() < Number(state.predictionCloseTimestamp) ?
                            <div className="mx-auto"
                                style={{
                                    width: "84%",
                                    textAlign: "center",
                                    color: "red",
                                    marginBottom: "30px"
                                }}
                            >
                                * Only invest if you trust above API, This will be used for
                                fetching result at the time of resolving the market.
                                </div>
                            : null
                        }

                        <Row>
                            <Col className="text-center">
                                {currentUnixTime() > Number(state.predictionCloseTimestamp) &&
                                    !state.isStakedOnAave && !state.isMarketResolved ?
                                    <Button
                                        variant="success"
                                        onClick={lendOnAave}
                                        style={{ marginBottom: "30px", marginTop: "20px" }}
                                    >
                                        {isLending ?
                                            <div className="d-flex align-items-center">
                                                Depositing
                                                <span className="loading ml-2"></span>
                                            </div>
                                            :
                                            <div>Deposit On Aave</div>
                                        }
                                    </Button>
                                    : (currentUnixTime() > Number(state.marketCloseTimestamp) &&
                                        !state.isMarketResolved ?
                                        <Button
                                            variant="warning"
                                            onClick={resolveMarket}
                                            style={{ marginBottom: "30px", marginTop: "20px" }}
                                        >
                                            {isResolving ?
                                                <div className="d-flex align-items-center">
                                                    Resolving
                                                <span className="loading ml-2"></span>
                                                </div>
                                                :
                                                <div>Resolve Market</div>
                                            }
                                        </Button>
                                        : null
                                    )
                                }
                            </Col>
                        </Row>

                        <Table striped bordered hover style={{
                            textAlign: "center",
                            marginBottom: "30px"
                        }}>
                            <thead>
                                <tr>
                                    <th>Outcome</th>
                                    <th>Amount Staked</th>
                                    <th>Win Probability</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.outcomes.map((element, k) => (
                                    <tr key={k}>
                                        <td>{Number(element.outcome)}</td>
                                        <td>{element.amountStaked} DAI</td>
                                        <td>{Number(state.totalAmountStaked) <= 0 ?
                                            <div>0 %</div>
                                            :
                                            <div>
                                                {(element.amountStaked / state.totalAmountStaked * 100).toFixed(2)} %
                                            </div>
                                        }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>

                        {Number(addressPredictions[0].prediction) !== 0 ?
                            <Row>
                                <Col>
                                    <p style={{
                                        textAlign: "center",
                                        fontWeight: "bold",
                                        fontSize: "1.2rem",
                                    }}>
                                        <u>Your Position</u>
                                    </p>

                                    <div style={{
                                        marginBottom: "30px",
                                        marginTop: "20px",
                                        fontSize: "1.1 rem",
                                        color: "green"
                                    }}>
                                        {currentUnixTime() > Number(state.marketCloseTimestamp) &&
                                            state.isMarketResolved ?
                                            <div style={{ textAlign: "center", fontWeight: "bold" }}>
                                                <span>Reward Earned:</span>
                                                <span> {state.rewardAmount} DAI</span>
                                            </div>
                                            : null
                                        }
                                    </div>

                                    <Table striped bordered hover style={{ textAlign: "center" }}>
                                        <thead>
                                            <tr>
                                                <th>Prediction</th>
                                                <th>Amount Staked</th>
                                                {currentUnixTime() > Number(state.marketCloseTimestamp) &&
                                                    state.isMarketResolved ?
                                                    <th>Result</th>
                                                    : null
                                                }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addressPredictions.map((element, k) => (
                                                <tr key={k}>
                                                    <td>{Number(element.prediction)}</td>

                                                    <td>{element.stakeAmount} DAI</td>

                                                    {currentUnixTime() > Number(state.marketCloseTimestamp) &&
                                                        state.isMarketResolved ?
                                                        <td>
                                                            {state.predictionResult == element.prediction ?
                                                                <div>
                                                                    <div style={{ color: "green" }}>You Won</div>
                                                                    {!state.isAlreadyWithdrawn ?
                                                                        <Button
                                                                            onClick={getReward}
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                        >
                                                                            {isProcessing ?
                                                                                <div className="d-flex align-items-center">
                                                                                    Processing
                                                                                    <span className="loading ml-2"></span>
                                                                                </div>
                                                                                :
                                                                                <div>Get Reward</div>
                                                                            }
                                                                        </Button>
                                                                        :
                                                                        <div>Already Withdrawn</div>
                                                                    }
                                                                </div>
                                                                :
                                                                <div>
                                                                    <div style={{ color: "red" }}>You Lost</div>
                                                                    {state.isLessRisky && !state.isAlreadyWithdrawn ?
                                                                        <Button
                                                                            onClick={getReward}
                                                                            variant="outline-success"
                                                                            size="sm"
                                                                        >
                                                                            {isProcessing ?
                                                                                <div>
                                                                                    Processing
                                                                                    <span className="loading ml-2"></span>
                                                                                </div>
                                                                                : <div>Get Stake</div>
                                                                            }
                                                                        </Button>
                                                                        :
                                                                        <div>Already Withdrawn</div>
                                                                    }
                                                                </div>
                                                            }
                                                        </td>
                                                        : null
                                                    }
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                            : null
                        }

                        {showMakePrediction ?
                            <div>
                                <Row>
                                    <Col>
                                        <p style={{
                                            textAlign: "center",
                                            fontWeight: "bold",
                                            fontSize: "1.1rem",
                                            marginTop: "10px"
                                        }}>
                                            <u>Create Position</u>
                                        </p>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col style={{ textAlign: "center", fontWeight: "bold", paddingTop: "5px" }}>
                                        Prediction:
                                </Col>
                                    <Col>
                                        <DropdownButton
                                            style={{
                                                paddingBottom: "30px",
                                                width: "150px"
                                            }}
                                            title={Number(details.prediction)}
                                            variant="outline-info"
                                            onSelect={(event) => setDetails({
                                                ...details,
                                                prediction: event
                                            })}
                                        >
                                            {state.outcomes.map((element, key) => (
                                                <Dropdown.Item key={key} eventKey={element.outcome}>
                                                    {Number(element.outcome)}
                                                </Dropdown.Item>
                                            ))}
                                        </DropdownButton>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col style={{ textAlign: "center", fontWeight: "bold" }}>
                                        Stake Amount:
                                    </Col>
                                    <Col>
                                        <Form.Control
                                            className="mb-4"
                                            type="number"
                                            placeholder="DAI Amount (eg: 1)"
                                            onChange={(e) => setDetails({
                                                ...details,
                                                amount: e.target.value
                                            })}
                                            style={{ width: "60%" }}
                                            value={details.amount}
                                            required
                                        />
                                    </Col>
                                </Row>
                                <Row className="text-center">
                                    <Col>
                                        <Button
                                            onClick={makePrediction}
                                            variant="outline-success"
                                        >
                                            {isApproving ?
                                                <div className="d-flex align-items-center">
                                                    Approving
                                                    <span className="loading ml-2"></span>
                                                </div>
                                                : (
                                                    isMakingPrediction ?
                                                        <div>
                                                            Processing
                                                            <span className="loading ml-2"></span>
                                                        </div>
                                                        : <div>Submit</div>
                                                )
                                            }
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                            : null
                        }
                    </Card.Body>

                    {!showMakePrediction && currentUnixTime() < Number(state.predictionCloseTimestamp) &&
                        addressPredictions[0].prediction === zeroBytes ?
                        <Card.Footer className="text-center" style={{ backgroundColor: '#FFFFFF50' }}>
                            <Button
                                onClick={setShowMakePrediction}
                                variant="outline-success"
                            >
                                Want to Predict ?
                                </Button>
                        </Card.Footer>
                        : null
                    }
                </Card>

                <AlertModal
                    open={errorModal.open}
                    toggle={() => setErrorModal({ ...errorModal, open: false })}
                >
                    {errorModal.msg}
                </AlertModal>

                <SuccessModal
                    open={successModal.open}
                    toggle={() => setSuccessModal({ ...successModal, open: false })}
                    onConfirm={handleReload}
                >
                    {successModal.msg}
                </SuccessModal>
            </div >
        );
    }

    return routes;
}
