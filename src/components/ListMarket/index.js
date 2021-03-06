import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Row, Card, Col } from "react-bootstrap";
import { ethers } from 'ethers';
import AlertModal from "../Utils/AlertModal";
import Loading from "../Utils/Loading";
import abi from "../../utils/pmAbi.json";

export default function ListMarket() {
    let routes;

    const [errorModal, setErrorModal] = useState({
        msg: "",
        open: false
    });

    const [loading, setLoading] = useState(true);
    const [markets, setMarkets] = useState([]);

    const contractAddresses = [
        "0x67A702b6b0498D90310CD6794c642B8A4bC39760",
        "0x37e0B7A17F90868F747F7421A3592e32d41FA2d0",
        "0x7AfE906624a79Fb351dE6340777225bAE65f7bB6",
        "0xdED5a05CccfCef9Af5D9ef70ABf21f1d17D7C107",
        "0xAc5D0F82954A6468Cb1052e891DEC14910ef7DbC",
    ];

    // const checkWeb3Connection = async () => {
    //     const web3 = window.ethereum;
    //     await web3.enable();

    //     const provider = new ethers.providers.Web3Provider(web3);
    //     const signer = provider.getSigner();
    //     const networkId = 42;

    //     if (networkId !== await signer.getChainId()) {
    //         setLoading(false);

    //         setErrorModal({
    //             open: true,
    //             msg: "Incorrect network choosen !! Please choose correct network.",
    //         });
    //     } else {
    //         setShowMakePrediction(true);
    //     }
    // };

    const getAllMarkets = async () => {
        try {
            const allMarkets = [];

            const web3 = window.ethereum;
            await web3.enable();
            const provider = new ethers.providers.Web3Provider(web3);

            if (contractAddresses.length > 0) {
                for (let i = 0; i < contractAddresses.length; i++) {
                    const contract = new ethers.Contract(
                        contractAddresses[i],
                        abi,
                        provider,
                    );

                    const question = await contract.question();
                    const isLessRisky = await contract.isLessRisky();
                    const totalAmountStaked = await contract.totalAmountStaked();
                    const marketCloseTimestamp = await contract.marketCloseTimestamp();

                    allMarkets.push({
                        contractAddress: contractAddresses[i],
                        question,
                        isLessRisky,
                        totalAmountStaked: ethers.utils.formatEther(totalAmountStaked),
                        marketCloseTimestamp,
                    });

                    if (i === contractAddresses.length - 1) {
                        setMarkets(allMarkets);
                        setLoading(false);
                    }
                }
            } else {
                setLoading(false);
            }
        } catch (error) {
            setErrorModal({
                open: true,
                msg: error.message,
            });
        }
    }

    const currentUnixTime = () => {
        return Math.floor((new Date()).getTime() / 1000);
    }

    const getTimeInString = (unixTimestamp) => {
        const tempTime = new Date(unixTimestamp * 1000)
            .toISOString()
            .replace('Z', ' ')
            .replace('T', ' ');

        const index = tempTime.indexOf('.');

        return tempTime.substring(0, index) + ' UTC';
    }

    useEffect(() => {
        if (markets.length === 0) {
            getAllMarkets();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        routes = <Loading />;
    } else {
        routes = (
            <div>
                <p style={{
                    marginTop: "3%",
                    textAlign: "center",
                    fontWeight: "bold",
                    fontSize: "1.5rem",
                }}>
                    <u>Available Markets</u>
                </p>

                {markets.map((element, k) => (
                    <Link key={k} style={{ textDecoration: "none" }} to={`/market/${element.contractAddress}`}>
                        <Card className="mx-auto market-card" key={k}>
                            <Card.Body>
                                <Row>
                                    <Col><strong>{element.question}</strong></Col>
                                </Row>
                                <Row style={{ marginTop: "20px" }}>
                                    <Col>
                                        {!element.isLessRisky ?
                                            <div>Normal Market</div>
                                            :
                                            <div>No Loss Market</div>
                                        }
                                    </Col>
                                    <Col className="vertical-line">
                                        {element.totalAmountStaked} DAI - Total Stake
                                </Col>
                                    <Col className="vertical-line">
                                        {element.marketCloseTimestamp > currentUnixTime() ?
                                            <div>
                                                {getTimeInString(element.marketCloseTimestamp)}
                                            </div>
                                            :
                                            <div>
                                                Market Closed
                                        </div>
                                        }
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Link>
                ))}

                <AlertModal
                    open={errorModal.open}
                    toggle={() => setErrorModal({ ...errorModal, open: false })}
                >
                    {errorModal.msg}
                </AlertModal>
            </div >
        );
    }

    return routes;
}
