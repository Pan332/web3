import './Dashboard.css'; // Optional: for custom styling
import Search from "../components/Search.jsx";
import React, { useEffect, useState } from 'react';
import { CampaignProvider } from '../components/CampaignContext';
import { useMetamaskAccount } from "../web3Context.jsx";

function Dashboard() {
    const port = import.meta.env.VITE_API_URL;
    const [userCount, setUserCount] = useState(0); // State for user count
    const [amount, setAmount] = useState(0); // State for user count

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { campaignCount, isConnected, connectWallet } = useMetamaskAccount();

     
    return (
        <div className="dashboard">
            <div className='headers'>
                <div className='pic'>
                    <h1 className='overlay-text'>Fundraiser</h1>
                    <p className='overlay-text2'>For charities No fee.</p>
                    <div className='pic'>
                        <h1 className='overlay-text'>Empowering Charities Together</h1>
                        <p className='overlay-text2'>For charities No fee.</p>
                        <div className='custom-search-container'>
                            <CampaignProvider>
                                <Search />
                            </CampaignProvider>
                        </div>
                    </div>
                </div>
            </div>
            <div className='visualization'>
                <div className='totalcampaign'>
                    <h2>Total Campaigns</h2>
                    <h2>{loading ? 'Loading...' : campaignCount}</h2>
                </div>
                <div className='totalfund'>
                    <h2>Total Funds</h2>
                    <h2>{loading ? 'Loading...' : amount} ETH</h2>
                </div>
                <div className='paticipant'>
                    <h2>Participants</h2>
                    <h2>{loading ? 'Loading...' : userCount}</h2>
                </div>
            </div>
            {error && <p className="error">{error}</p>}
        
        </div>
        
    );
}

export default Dashboard;
