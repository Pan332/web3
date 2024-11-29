// Card.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Card.css'; 

function Card({ id, title, owner, image, description = '', goal, raised, timeRemaining }) {
  const progressPercentage = Math.min((raised / goal) * 100, 100);
  console.log("Image URL:", image); // Check if the image URL is correct
  return (
    <Link to={`/CampaignsDetailsPage/${title}/${owner}`} className="campaign-card-link">
      <div className="campaign-card">
        <img src={image} alt={title} className="campaign-image" />
        <div className="card-content">
          <h2 className="campaign-title">{title}</h2>
          <p className="campaign-owner">By {owner.slice(0, 9)}...{owner.slice(-4)}</p>
          <p className="campaign-description">{description.substring(0, 150)}</p>
          <div className="campaign-goal">
            <p>Raised: {raised.toLocaleString()} ETH</p>
            <p>Goal: {goal.toLocaleString()} ETH</p>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
            <span className="progress-percentage">{Math.round(progressPercentage)}%</span>
          </div>
          <p className="time-remaining">{timeRemaining}</p>
        </div>
      </div>
    </Link>
  );
}

export default Card;
