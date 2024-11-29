import React, { createContext, useContext, useState, useEffect } from "react";
import Web3 from "web3";
import Thaifunder from '../build/contracts/Thaifunder.json'; // Ensure the ABI path is correct

const contractABI = Thaifunder.abi;
const contractAddress = "0xDAC1947dF531A955468684Fac23cf6C8a683764C"; // Replace with actual deployed contract address

const MetamaskAccountContext = createContext();

const LOGOUT_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const MetamaskAccountProvider = ({ children }) => {
    const [web3, setWeb3] = useState(null);
    const [currentMetaMaskAccount, setCurrentMetaMaskAccount] = useState(null);
    const [connectedAccount, setConnectedAccount] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [balance, setBalance] = useState(null);
    const [logoutTimer, setLogoutTimer] = useState(null);
    const [campaignCount, setCampaignCount] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const contract = web3 ? new web3.eth.Contract(contractABI, contractAddress) : null;

    // Initialize Web3 and fetch MetaMask account
    useEffect(() => {
        if (window.ethereum) {
            const web3Instance = new Web3(window.ethereum);
            setWeb3(web3Instance);

            const fetchMetaMaskAccount = async () => {
                const accounts = await window.ethereum.request({ method: "eth_accounts" });
                setCurrentMetaMaskAccount(accounts[0] || null);
            };

            fetchMetaMaskAccount();

            // Restore connection from localStorage
            const savedAccount = localStorage.getItem("connected_account");
            if (savedAccount) {
                reconnect(savedAccount);
            }

            // Listen for account changes in MetaMask
            const handleAccountsChanged = (accounts) => {
                setCurrentMetaMaskAccount(accounts[0] || null);
            };

            // Adding the listener once
            window.ethereum.on("accountsChanged", handleAccountsChanged);

            // Cleanup function to remove listeners when component unmounts or when the effect runs again
            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            };
        } else {
            console.error("MetaMask not detected");
        }
    }, []); // Empty dependency array to ensure this effect runs only once on mount

    const reconnect = async (savedAccount) => {
        if (!web3) return;

        try {
            const accountBalance = await web3.eth.getBalance(savedAccount);
            setConnectedAccount(savedAccount);
            setBalance(web3.utils.fromWei(accountBalance, "ether"));
            setIsConnected(true);
            startLogoutTimer(); // Restart the logout timer

            // Fetch campaign count and all campaigns
            fetchCampaignCount();
            fetchCampaigns();
        } catch (error) {
            console.error("Error reconnecting:", error);
        }
    };

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                const account = accounts[0];
                
                const balanceInWei = await web3.eth.getBalance(account);
                const balanceInEth = web3.utils.fromWei(balanceInWei, "ether");
    
                // Update state
                setConnectedAccount(account);
                setBalance(balanceInEth);
                setIsConnected(true);
    
                // Save account and balance to localStorage
                localStorage.setItem("connected_account", account);
                localStorage.setItem("balance", balanceInEth);
    
                startLogoutTimer();
    
                return { account, balanceInEth };
            } catch (error) {
                console.error("Error connecting wallet:", error);
            }
        } else {
            console.error("MetaMask is not installed");
        }
    };
    

    const startLogoutTimer = () => {
        if (logoutTimer) clearTimeout(logoutTimer);

        const timer = setTimeout(() => {
            logout();
        }, LOGOUT_TIMEOUT);

        setLogoutTimer(timer);
    };

    const logout = () => {
        setConnectedAccount(null);
        setIsConnected(false);
        setBalance(null);
        setCampaignCount(0);
        setCampaigns([]);
        localStorage.removeItem("connected_account");
        if (logoutTimer) clearTimeout(logoutTimer);
    };

    // Fetch the campaign count from the smart contract
    const fetchCampaignCount = async () => {
        if (contract) {
            try {
                const count = await contract.methods.numberOfCampaigns().call();
                setCampaignCount(parseInt(count, 10));
            } catch (error) {
                console.error("Error fetching campaign count:", error);
            }
        }
    };

    const fetchCampaigns = async () => {
        if (contract) {
            try {
                const response = await contract.methods.getCampaigns().call();
    
                // Log the response to debug the structure
                console.log('Campaigns Response:', response);
    
                // Check if the response contains the necessary properties and that they are not undefined
                if (response && Array.isArray(response.owners) && response.owners.length > 0) {
                    const campaigns = response.owners.map((owner, index) => {
                        // Make sure each array element exists
                        const title = response.titles && response.titles[index] ? response.titles[index] : '';
                        const description = response.descriptions && response.descriptions[index] ? response.descriptions[index] : '';
                        const goalAmount = response.goalAmounts && response.goalAmounts[index] 
                            ? web3.utils.fromWei(response.goalAmounts[index].toString(), "ether") 
                            : '0';
                        const earnAmount = response.earnAmounts && response.earnAmounts[index] 
                            ? web3.utils.fromWei(response.earnAmounts[index].toString(), "ether") 
                            : '0';
                        const deadline = response.deadlines && response.deadlines[index] 
                            ? new Date(parseInt(response.deadlines[index]) * 1000) 
                            : new Date();
                        const tag = response.tags && response.tags[index] ? response.tags[index] : '';
                        const image = response.ipfsImageCids && response.ipfsImageCids[index] ? response.ipfsImageCids[index] : '';
                        const isClosed = response.isClosed && response.isClosed[index] ? response.isClosed[index] : false;
                        console.log(`http://localhost:8081/ipfs/${image}`);
                        return {
                            id: index,
                            owner,
                            title,
                            description,
                            goalAmount,
                            earnAmount,
                            deadline,
                            tag,
                            image: `http://localhost:8081/ipfs/${image}`, // Fixed string interpolation
                            isClosed,
                        };
                    });
    
                    setCampaigns(campaigns);
                } else {
                    console.error("Invalid response format: Missing necessary arrays", response);
                }
            } catch (error) {
                console.error("Error fetching campaigns:", error);
            }
        }
    };
      
    // Create a new campaign
    const createCampaign = async (title, shortDescription, description, tag, goalAmount, deadline, _ipfsImageCid) => {
        try {
            if (!contract) {
                throw new Error("Contract not initialized");
            }
    
            if (typeof contract.methods.createCampaigns !== "function") {
                throw new Error("createCampaigns method not found in contract");
            }
    
            // Validate goal amount
            const goalAmountNum = parseFloat(goalAmount);
            if (isNaN(goalAmountNum) || goalAmountNum <= 0) {
                throw new Error("Goal amount must be a positive number");
            }
    
            // Convert goal amount to Wei
            const goalInWei = web3.utils.toWei(goalAmountNum.toString(), "ether");
    
            // Validate other field
            if (!title || !shortDescription || !description || !tag || !deadline || !_ipfsImageCid) {
                throw new Error("All fields are required.");
            }
    
            // Convert deadline to contract-compatible timestamp
            const deadlineInSeconds = Math.floor(new Date(deadline).getTime() / 1000);
    
    
            // Send the transaction using createCampaigns
            const tx = await contract.methods
                .createCampaigns(
                    connectedAccount,
                    title,
                    shortDescription,
                    description,
                    tag,
                    goalInWei,
                    deadlineInSeconds,
                    _ipfsImageCid,
                )
                .send({ from: connectedAccount });
    
            console.log("Campaign created successfully:", tx);
            fetchCampaigns(); // Refresh campaigns after creation
            return { success: true, receipt: tx };
        } catch (error) {
            console.error("Error creating campaign:", error.message);
            return { success: false, error: error.message };
        }
    };
    
    
    const donateToCampaign = async (id, amount) => {
        try {
            // Ensure the user is connected and get their account address
            const connectedAccount = await web3.eth.getAccounts();
            if (!connectedAccount || connectedAccount.length === 0) {
                throw new Error("No account is connected.");
            }
    
            // Get all campaigns' data
            const campaignsData = await contract.methods.getCampaigns().call();
    
            // Log the response to check the structure
            console.log("Campaigns Data:", campaignsData);
    
            // Destructure the campaigns data
            const {
                owners,
                titles,
                descriptions,
                goalAmounts,
                earnAmounts,
                deadlines,
                tags,
                ipfsImageCids,
                isClosed,
            } = campaignsData;
    
            // Check if the campaign exists by the id
            if (id >= owners.length) throw new Error("Campaign not found");
    
            // Access the campaign data by id
            const goalAmount = web3.utils.fromWei(goalAmounts[id], "ether");
            const earnAmount = web3.utils.fromWei(earnAmounts[id], "ether");
            const campaignIsClosed = isClosed[id];
    
            if (campaignIsClosed) throw new Error("Campaign is closed");
            if (parseFloat(earnAmount) >= parseFloat(goalAmount)) {
                throw new Error("Goal already reached");
            }
    
            // Proceed with donation
            const tx = await contract.methods.donateToCampaigns(id).send({
                from: connectedAccount[0], // Ensure correct address
                value: web3.utils.toWei(amount, "ether"),
            });
    
            console.log("Donation successful!", tx);
            fetchCampaigns(); // Update campaigns after donation
            return { success: true, transaction: tx };
        } catch (error) {
            console.error("Error donating:", error);
            return { success: false, error: error.message };
        }
    };
    
    
    
    
      const getDonator = async (id) => {
        try {
            const response = await contract.methods.getDonators(id).call();
            const addresses = response[0]; // List of donor addresses
            const amounts = response[1]; // Corresponding donation amounts in Wei

            const donators = addresses.map((address, index) => ({
                address,
                amount: web3.utils.fromWei(amounts[index], "ether"),
            }));
            return { success: true, donators };
        } catch (error) {
            console.error("Error fetching donators:", error);
            return { success: false, error: error.message };
        }
    };
    

    return (
        <MetamaskAccountContext.Provider
            value={{
                web3,
                currentMetaMaskAccount,
                connectedAccount,
                balance,
                isConnected,
                campaignCount,
                campaigns,
                connectWallet,
                logout,
                createCampaign,
                fetchCampaigns,
                donateToCampaign,
                getDonator,
                
            }}
        >
            {children}
        </MetamaskAccountContext.Provider>
    );
};

export const useMetamaskAccount = () => useContext(MetamaskAccountContext);
