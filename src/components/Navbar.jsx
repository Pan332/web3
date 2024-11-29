import React, { useState, useEffect } from "react";
import { BiLogOut } from "react-icons/bi"; // Import BiLogOut icon from react-icons
import LoginModal from './LoginModal';
import './Navbar.css';
import { Link, useNavigate } from 'react-router-dom';
import { useMetamaskAccount } from "../web3Context.jsx";

const Navbar = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isCategoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [address, setAddress] = useState(null); // State for the address
  const [balance, setBalance] = useState(null); // State for the balance
  const navigate = useNavigate();
  
  const {
    currentMetaMaskAccount,
    connectedAccount,
    walletBalance,
    isConnected,
    connectWallet,
    logout,
    
  } = useMetamaskAccount();

  // Load address and balance from localStorage on component mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('connected_account');
    const savedBalance = localStorage.getItem('balance');
    
    if (savedAccount) {
      setAddress(savedAccount); // Restore address
    }

    if (savedBalance) {
      const balanceInEth = savedBalance / Math.pow(10, 18);
      setBalance(balanceInEth); // Restore balance in ETH
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      // Connect to the wallet
      const { account, balanceInEth } = await connectWallet();

      // Update the state immediately
      setAddress(account);
      setBalance(balanceInEth);

      // Save data to localStorage for persistence
      localStorage.setItem('connected_account', account);
      localStorage.setItem('balance', balanceInEth * Math.pow(10, 18)); // Save balance in Wei
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleCategoriesDropdown = () => {
    setCategoriesDropdownOpen(!isCategoriesDropdownOpen);
  };

  const handleLogout = () => {
    logout(); // Use Web3 logout to clear MetaMask-related state
    setAddress(null); // Clear address state
    setBalance(null); // Clear balance state
    localStorage.removeItem('connected_account'); // Clear localStorage
    localStorage.removeItem('balance');
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/">
            <img className="logo" src="/logo.png" alt="" />
          </Link>
        </div>

        <div className="navbar-center">
          <ul className={isMobileMenuOpen ? "navbar-links mobile-open" : "navbar-links"}>
            <li className="navbar-item">
              <Link to="/CharitiesPage">Charity Campaigns</Link>
            </li>
            <li
              className="navbar-item"
              onMouseEnter={toggleCategoriesDropdown}
              onMouseLeave={toggleCategoriesDropdown}
            >
              <Link to="/CategoriesPage">
                All Campaigns <span className="dropdown-arrow">▼</span>
              </Link>
              {isCategoriesDropdownOpen && (
                <ul className="dropdown">
                  <li>
                    <Link to="/EducationPage">Education</Link>
                  </li>
                  <li>
                    <Link to="/GamesPage">Game</Link>
                  </li>
                  <li>
                    <Link to="/MusicPage">Music</Link>
                  </li>
                  <li>
                    <Link to="/BooksPage">Book</Link>
                  </li>
                  <li>
                    <Link to="/TechnologyPage">Technology</Link>
                  </li>
                  <li>
                    <Link to="/CategoriesPage">View all</Link>
                  </li>
                </ul>
              )}
            </li>
            <li className="navbar-item">
              <Link to="/AboutPage">About</Link>
            </li>
            <li className="navbar-item">
              <Link to="/ServicePage">Services</Link>
            </li>
            <li className="navbar-item">
              <Link to="/ContactPage">Contact</Link>
            </li>
          </ul>
        </div>

        <div className="campaign-section">
          <Link to="/CampaignManager" className="createBtn">
            Create Campaign
          </Link>

          {address ? (
            // Show connected account and balance
            <div className="connected-info">
            
            <BiLogOut
                className="logout-icon"
                onClick={handleLogout}
                title="Logout"
                style={{ cursor: "pointer", color: "red" }}
              />
                 <p className="connected-account">
                <strong>Address:</strong> {address.slice(0, 6)}...{address.slice(-4)}
              </p>
              <p className="connected-balance">
                <strong>Balance:</strong> {balance ? `${balance} ETH` : "Loading..."}
              </p>
            </div>
          ) : (
            // Show "Connect" button when not connected
            <a className="login" onClick={handleConnectWallet}>
              Connect
            </a>
          )}
        </div>

        <div className="menu-toggle" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? (
            <span>&#10005;</span> // X icon for closing
          ) : (
            <span>&#9776;</span> // Hamburger icon for opening
          )}
        </div>
      </nav>

      {isLoginModalOpen && <LoginModal closeModal={() => setLoginModalOpen(false)} />}
    </>
  );
};

export default Navbar;
