import React, { useState } from "react";
import { useMetamaskAccount } from "../web3Context.jsx";
import axios from 'axios';

const CampaignManager = () => {
  const { createCampaign, isConnected, connectWallet } = useMetamaskAccount();
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState(""); // State for short description
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [image, setImage] = useState(null); // Store the file
  const [imageCID, setImageCID] = useState(""); // Store the CID from IPFS
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Send the image to your backend for uploading to IPFS
        const response = await axios.post("http://127.0.0.1:4321/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.cid) {
          setImageCID(response.data.cid); // Set the CID
          setImage(file); // Optionally store the file
          alert("Image uploaded successfully!");
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        setError("Failed to upload image.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate goalAmount as a valid positive number before proceeding
    const goalAmountNum = parseFloat(goalAmount);
    if (isNaN(goalAmountNum) || goalAmountNum <= 0) {
      alert("Goal amount must be a positive number");
      return;
    }

    // Validate other form fields
    if (!title || title.trim() === "") {
      alert("Title is required");
      return;
    }
    if (!shortDescription || shortDescription.trim() === "") { // Validate short description
      alert("Short description is required");
      return;
    }
    if (!description || description.trim() === "") {
      alert("Description is required");
      return;
    }
    if (!tag || tag.trim() === "") {
      alert("Tag is required");
      return;
    }
    if (!deadline || isNaN(new Date(deadline).getTime())) {
      alert("Invalid deadline date");
      return;
    }
    if (!imageCID || imageCID.trim() === "") {
      alert("Image is required");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCampaign(title, shortDescription, description, tag, goalAmountNum, deadline, imageCID);
      if (result.success) {
        alert("Campaign created successfully!");
        // Reset form
        setTitle("");
        setShortDescription(""); // Reset short description
        setDescription("");
        setTag("");
        setGoalAmount("");
        setDeadline("");
        setImage(null);
        setImageCID("");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error.message);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Create a Campaign</h2>
      {!isConnected && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Short Description:</label> {/* Added Short Description */}
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Tag:</label>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Goal Amount (ETH):</label>
          <input
            type="number"
            value={goalAmount}
            onChange={(e) => setGoalAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Deadline:</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Image (IPFS):</label>
          <input
            type="file"
            onChange={handleImageUpload}
            accept="image/*"
            required
          />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Campaign"}
        </button>
      </form>
    </div>
  );
};

export default CampaignManager;
