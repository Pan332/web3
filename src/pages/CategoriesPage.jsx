import React, { useEffect, useState } from 'react';
import Navbar from "../components/Navbar.jsx";
import Footer from '../components/Footer.jsx';
import Card from "../components/Card.jsx";
import './CategoriesPage.css';
import Search from "../components/Search.jsx";
import { CampaignProvider } from '../components/CampaignContext';
import { useMetamaskAccount } from "../web3Context.jsx";

function CategoriesPage() {
  
  const port = import.meta.env.VITE_API_URL;
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const rowsPerPage = 8;
 
  const [loading, setLoading] = useState(true);

  const { campaigns, fetchCampaigns, currentMetaMaskAccount, campaignCount } = useMetamaskAccount(); 

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

  console.log(campaigns);

  const calculateTimeRemaining = (deadline) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDifference = deadlineDate - now;
    return timeDifference > 0
      ? `${Math.floor(timeDifference / (1000 * 60 * 60 * 24))} day left`
      : "Campaign ended";
  };


  const paginatedCampaigns = campaigns.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(campaigns.length / rowsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  return (
    <> 
    <CampaignProvider>
      <Navbar />
      <main className="categories-page">
        <h1>All Campaigns</h1>
          <Search/>
      
        {loading ? (
          <p className="loading-message">Loading campaigns...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : campaigns.length === 0 ? (
          <p className="empty-message">No campaigns available at the moment.</p>
        ) : 
        
        (
          
          <div className="campaigns-container">
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
          
        )}
      </main>
      <div className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`btn ${page === currentPage ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
      <Footer />
      </CampaignProvider>
    </>
  );
}

export default CategoriesPage;
