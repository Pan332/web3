// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract Thaifunder {
    struct Campaign {
        string title;
        address owner;
        string shortDescription;
        string description;
        string tag;
        uint256 goalAmount;
        uint256 earnAmount;
        uint256 deadline;
        string ipfsImageCid; // IPFS CID for image
        mapping(address => uint256) donations; // Maps donor addresses to their total donations
        address[] donators; // Optional: Keep this if you need to list all donors
        bool isClosed; // To track if the campaign is closed to donations
    }

    mapping(uint256 => Campaign) public campaigns;

    uint256 public numberOfCampaigns = 0;

    event CampaignCreated(
        uint256 indexed id,
        address owner,
        string title,
        uint256 goalAmount,
        uint256 deadline
    );
    event DonationReceived(uint256 indexed id, address donor, uint256 amount);
    event CampaignClosed(uint256 indexed id); // New event for closing campaign

    // Function to create a campaign
    function createCampaigns(
        address _owner,
        string memory _title,
        string memory _shortDescription,
        string memory _description,
        string memory _tag,
        uint256 _goalAmount,
        uint256 _deadline,
        string memory _ipfsImageCid // CID for IPFS image
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline should be in the future");

        // Initialize a new campaign in storage directly
        Campaign storage newCampaign = campaigns[numberOfCampaigns];
        newCampaign.owner = _owner;
        newCampaign.title = _title;
        newCampaign.shortDescription = _shortDescription;
        newCampaign.description = _description;
        newCampaign.tag = _tag;
        newCampaign.goalAmount = _goalAmount;
        newCampaign.earnAmount = 0;
        newCampaign.deadline = _deadline;
        newCampaign.ipfsImageCid = _ipfsImageCid; // Store IPFS CID
        newCampaign.isClosed = false; // Initially open for donations

        emit CampaignCreated(
            numberOfCampaigns,
            _owner,
            _title,
            _goalAmount,
            _deadline
        );

        // Increment the number of campaigns
        numberOfCampaigns++;
        return numberOfCampaigns - 1;
    }

    // Function to donate to a campaign
    function donateToCampaigns(uint256 _id) public payable {
    uint256 amount = msg.value;
    Campaign storage campaign = campaigns[_id];

    require(!campaign.isClosed, "Campaign is closed to donations");
    require(campaign.earnAmount + amount <= campaign.goalAmount, "Donation exceeds goal amount");

    // Add or update the donor's donation amount
    if (campaign.donations[msg.sender] == 0) {
        campaign.donators.push(msg.sender); // Add new donor to the list
    }
    campaign.donations[msg.sender] += amount;

    // Transfer funds to the campaign owner
    (bool sent, ) = payable(campaign.owner).call{value: amount}("");
    require(sent, "Failed to send Ether");

    // Update campaign earnings
    campaign.earnAmount += amount;

    emit DonationReceived(_id, msg.sender, amount);

    // Close the campaign if the goal is reached
    if (campaign.earnAmount >= campaign.goalAmount) {
        campaign.isClosed = true;
        emit CampaignClosed(_id);
    }
}

    // Function to get donors and donations for a campaign
    function getDonators(uint256 _id)
    public
    view
    returns (address[] memory, uint256[] memory)
{
    Campaign storage campaign = campaigns[_id];
    uint256 donorCount = campaign.donators.length;

    uint256[] memory donationAmounts = new uint256[](donorCount);

    for (uint256 i = 0; i < donorCount; i++) {
        address donor = campaign.donators[i];
        donationAmounts[i] = campaign.donations[donor];
    }

    return (campaign.donators, donationAmounts);
}

    // Function to get all campaigns
    function getCampaigns()
        public
        view
        returns (
            address[] memory owners,
            string[] memory titles,
            string[] memory descriptions,
            uint256[] memory goalAmounts,
            uint256[] memory earnAmounts,
            uint256[] memory deadlines,
            string[] memory tags,
            string[] memory ipfsImageCids, // Add CID array
            bool[] memory isClosed // Add closed status
        )
    {
        uint256 campaignCount = numberOfCampaigns;

        // Create arrays for each field
        owners = new address[](campaignCount);
        titles = new string[](campaignCount);
        descriptions = new string[](campaignCount);
        goalAmounts = new uint256[](campaignCount);
        earnAmounts = new uint256[](campaignCount);
        deadlines = new uint256[](campaignCount);
        tags = new string[](campaignCount);
        ipfsImageCids = new string[](campaignCount); // Add CID field
        isClosed = new bool[](campaignCount);

        // Populate arrays with campaign data
        for (uint256 i = 0; i < campaignCount; i++) {
            Campaign storage campaign = campaigns[i];
            owners[i] = campaign.owner;
            titles[i] = campaign.title;
            descriptions[i] = campaign.description;
            goalAmounts[i] = campaign.goalAmount;
            earnAmounts[i] = campaign.earnAmount;
            deadlines[i] = campaign.deadline;
            tags[i] = campaign.tag;
            ipfsImageCids[i] = campaign.ipfsImageCid; // Include CID
            isClosed[i] = campaign.isClosed; // Include closed status
        }

        return (
            owners,
            titles,
            descriptions,
            goalAmounts,
            earnAmounts,
            deadlines,
            tags,
            ipfsImageCids,
            isClosed
        );
    }
}
