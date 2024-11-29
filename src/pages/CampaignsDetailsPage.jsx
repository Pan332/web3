import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import './CampaignsDetailsPage.css';
import { useMetamaskAccount } from "../web3Context.jsx";
import { 
    Container, Typography, Button, Modal, TextField, CircularProgress, Alert, 
    Box, Grid, Card, CardContent, CardMedia, CardActions, LinearProgress 
} from '@mui/material';

function CampaignsDetailsPage() {
    const { title, owner } = useParams();
    const { campaigns, fetchCampaigns, donateToCampaign, getDonator, campaignCount, currentMetaMaskAccount } = useMetamaskAccount();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [donators, setDonators] = useState([]);
    const [donatorsLoading, setDonatorsLoading] = useState(false);
    const [donatorsError, setDonatorsError] = useState(null);

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
      }, [currentMetaMaskAccount, campaignCount]);

    // Find the campaign based on the URL params
    const campaign = campaigns.find(
        (c) => c.title === title && c.owner.toLowerCase() === owner.toLowerCase()
    );

    // Fetch donators when the campaign is available
    useEffect(() => {
        const fetchDonators = async () => {
            if (!campaign) return;

            setDonatorsLoading(true);
            setDonatorsError(null);

            try {
                const response = await getDonator(campaign.id);
                if (response.success) {
                    setDonators(response.donators);
                } else {
                    setDonatorsError(response.error);
                }
            } catch (error) {
                console.error("Error fetching donators:", error);
                setDonatorsError("Failed to fetch donators.");
            } finally {
                setDonatorsLoading(false);
            }
        };

        fetchDonators();
    }, [campaign, getDonator]);

    const toggleDonateModal = () => {
        setShowDonateModal(!showDonateModal);
    };

    const handleDonate = async () => {
        if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
            setFeedback("Please enter a valid donation amount.");
            return;
        }

        try {
            const response = await donateToCampaign(campaign.id, donationAmount);
            if (response.success) {
                setFeedback("Donation successful! Thank you for your support.");
                await fetchCampaigns(); // Refresh campaign data after donation
                setShowDonateModal(false);
                fetchDonators(); // Refresh donators after donation
            } else {
                setFeedback(`Error: ${response.error}`);
            }
        } catch (error) {
            console.error("Unexpected error during donation:", error);
            setFeedback("An unexpected error occurred while processing your donation.");
        }
    };

    const calculateTimeRemaining = (deadline) => {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const timeDifference = deadlineDate - now;
        return timeDifference > 0
            ? `${Math.floor(timeDifference / (1000 * 60 * 60 * 24))} days left`
            : 'Campaign ended';
    };

    if (loading) {
        return <p>Loading campaign details...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    if (!campaign) {
        return <p>Campaign not found.</p>;
    }

    return (
        <Container 
            maxWidth={false} 
            disableGutters 
            sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
        >
            <Navbar />
            <Grid container spacing={3} sx={{ flex: 1, pl: 50 }}> 
                <Grid item xs={12} md={5} sx={{ pl: 0 }}>
                    <Card>
                        <CardMedia
                            component="img"
                            height="400"
                            image={campaign.image}
                            alt={campaign.title}
                        />
                    </Card>
                </Grid>
                <Grid item xs={12} md={5} sx={{ pr: 30 }}>
                    <Box>
                        <Typography variant="h4" gutterBottom>{campaign.title}</Typography>
                        <Typography variant="body1" gutterBottom>
                            Organized by: {campaign.owner}
                        </Typography>

                        <Box mt={2}>
                            <Typography variant="h6">Goal: {campaign.goalAmount} ETH</Typography>
                            <Typography variant="h6">Raised: {campaign.earnAmount} ETH</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={(campaign.earnAmount / campaign.goalAmount) * 100}
                            />
                            <Typography variant="body2" mt={1}>
                                Time remaining: {calculateTimeRemaining(campaign.deadline)}
                            </Typography>
                        </Box>

                        <Typography 
                            variant="body1" 
                            mt={2} 
                            dangerouslySetInnerHTML={{ __html: campaign.description }} 
                            sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }} 
                        />

                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={toggleDonateModal} 
                            sx={{ mt: 2 }}
                        >
                            Donate Now
                        </Button>
                    </Box>
                </Grid>

                <Modal open={showDonateModal} onClose={toggleDonateModal}>
                    <Box sx={{ 
                        position: 'absolute', top: '50%', left: '50%', 
                        transform: 'translate(-50%, -50%)', 
                        bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 
                    }}>
                        <Typography variant="h6" component="h2">Donate to {campaign.title}</Typography>
                        <TextField
                            label="Amount (ETH)"
                            type="number"
                            variant="outlined"
                            fullWidth
                            value={donationAmount}
                            onChange={(e) => setDonationAmount(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                         {feedback && (
                            <Alert severity={feedback.startsWith("Error") ? "error" : "success"} sx={{ mt: 2 }}>
                                {feedback}
                            </Alert>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button onClick={toggleDonateModal} sx={{ mr: 1 }}>Cancel</Button>
                            <Button variant="contained" onClick={handleDonate}>Donate</Button>
                        </Box>
                    </Box>
                </Modal>

                <Grid item xs={12}>
                    <Typography variant="h5" gutterBottom>Donators</Typography>
                    {donatorsLoading ? (
                        <CircularProgress />
                    ) : donatorsError ? (
                        <Alert severity="error">{donatorsError}</Alert>
                    ) : (
                        <Box>
                           {donators.length > 0 ? (
                                donators.map((donator, index) => (
                                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">{donator.address}</Typography>
                                        <Typography variant="body2">{donator.amount} ETH</Typography>
                                    </Box>
                                ))
                            ) : (
                                <Typography variant="body2">No donations yet.</Typography>
                            )}
                        </Box>
                    )}
                </Grid>
            </Grid>
            <Footer />
        </Container>
    );
}

export default CampaignsDetailsPage;
