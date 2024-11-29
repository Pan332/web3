import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Navbar from "../components/Navbar.jsx";
import Dashboard from '../components/Dashboard.jsx';
import Card from "../components/Card.jsx";
import Categories from "../components/Category.jsx";
import Footer from '../components/Footer.jsx';
import HowItWorks from "../components/HowItWorks.jsx";
import Why from "../components/Why.jsx";
import Search from "../components/Search.jsx";
import web3 from '../web3';
import './Homepage.css'; 
import { useMetamaskAccount } from "../web3Context.jsx";

function Homepage() {
  const { campaigns, fetchCampaigns, currentMetaMaskAccount, campaignCount } = useMetamaskAccount(); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        if (currentMetaMaskAccount) {  // Only fetch campaigns when MetaMask account is connected
          await fetchCampaigns(); // Fetch campaigns from the smart contract
        }
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [currentMetaMaskAccount, campaignCount]); // Fetch campaigns when MetaMask account or campaignCount changes

  console.log(campaigns); // Logs the campaigns after fetching

  const calculateTimeRemaining = (deadline) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDifference = deadlineDate - now;
    return timeDifference > 0
      ? `${Math.floor(timeDifference / (1000 * 60 * 60 * 24))} day left`
      : "Campaign ended";
  };

  return (
    <>
      <Navbar />
      <Dashboard />

      <div className="trend-campaign">
        <h1 className="trend-text">Charities</h1>
        <div className="card-container">
          {campaigns.map((campaign, index) => (
            <Card
              key={index} // Adding unique key for each card
              title={campaign.title}
              owner={campaign.owner} // Assuming first_name is the creator's name
              image={campaign.image}
              description={campaign.shortDescription}
              goal={campaign.goalAmount}
              raised={campaign.earnAmount}
              timeRemaining={calculateTimeRemaining(campaign.deadline)}
            />
          ))}
        </div>
      </div>

      <div className="taking-off">
        <h1 className="taking-off-text">Taking Off</h1>
        <div className="card-container">
          {/* Add cards for 'Taking Off' section */}
        </div>
      </div>

      <div className="feature-campaign">
        <h1 className="feature-campaign-text">Featured Project</h1>
        <div className="card-container">
          {/* Add cards for 'Featured Project' section */}
        </div>
      </div>

      <div className="feature-campaign">
        <h1 className="feature-campaign-text">Why Thaifunder?</h1>
        <Why />
      </div>

      <div className="feature-campaign">
        <h1 className="feature-campaign-text">How it Works?</h1>
        <HowItWorks />
      </div>

      <div className="categories">
        <h1 className="category-text">Fundraising Categories</h1>
        <Categories />
      </div>

      <Footer />
    </>
  );
}

export default Homepage;
