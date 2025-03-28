import React, { useState } from "react";
import styled from "styled-components";
import { Alert, Snackbar } from "@mui/material";
import { decodeRoyalties } from "@/utils/hf";

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const InputArea = styled.input`
  width: 100%;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--background-secondary);
  color: var(--text-primary);
  font-family: monospace;
`;

const Button = styled.button`
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsContainer = styled.div`
  background: var(--background-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

interface RoyaltyInfo {
  creator1Address: string;
  creator1Points: number;
  creator2Address: string;
  creator2Points: number;
  creator3Address: string;
  creator3Points: number;
  creatorAddressCount: number;
  royaltyPercent: number;
  royaltyPoints: number;
}

const RoyaltyChecker: React.FC = () => {
  const [collectionId, setCollectionId] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [royaltyInfo, setRoyaltyInfo] = useState<RoyaltyInfo | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "error" | "success";
  }>({
    open: false,
    message: "",
    severity: "error",
  });

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  const handleCheck = async () => {
    if (!collectionId) {
      setToast({
        open: true,
        message: "Please enter a collection ID",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const baseUrl = "https://mainnet-idx.nautilus.sh/nft-indexer/v1/tokens?contractId=" + collectionId;
      const url = tokenId ? `${baseUrl}&tokenId=${tokenId}` : `${baseUrl}&limit=1`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch collection data");
      }

      const data = await response.json();

      if (data.tokens && data.tokens.length > 0) {
        const token = data.tokens[0];
        if (token.metadata) {
          const metadata = JSON.parse(token.metadata);
          const { royalties } = metadata;
          const royaltyInfo = decodeRoyalties(royalties);
          setRoyaltyInfo(royaltyInfo);
        } else {
          setRoyaltyInfo(null);
        }
      } else {
        setRoyaltyInfo(null);
      }
    } catch (error) {
      setToast({
        open: true,
        message: "Failed to check royalty information",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  console.log(royaltyInfo);

  return (
    <Container>
      <h2>Royalty Checker</h2>
      <p>Enter a collection ID and optionally a token ID to check royalty information.</p>

      <InputArea
        type="text"
        value={collectionId}
        onChange={(e) => setCollectionId(e.target.value)}
        placeholder="Enter collection ID..."
        aria-label="Collection ID input"
      />

      <InputArea
        type="text"
        value={tokenId}
        onChange={(e) => setTokenId(e.target.value)}
        placeholder="Enter token ID (optional)..."
        aria-label="Token ID input"
      />

      <Button onClick={handleCheck} disabled={loading}>
        {loading ? "Checking..." : "Check Royalty"}
      </Button>

      {royaltyInfo && (
        <ResultsContainer>
          <div><strong>Creator 1 Address:</strong> {royaltyInfo.creator1Address}</div>
          <div><strong>Creator 1 Points:</strong> {royaltyInfo.creator1Points}</div>
          <div><strong>Creator 2 Address:</strong> {royaltyInfo.creator2Address}</div>
          <div><strong>Creator 2 Points:</strong> {royaltyInfo.creator2Points}</div>
          <div><strong>Creator 3 Address:</strong> {royaltyInfo.creator3Address}</div>
          <div><strong>Creator 3 Points:</strong> {royaltyInfo.creator3Points}</div>
          <div><strong>Creator Address Count:</strong> {royaltyInfo.creatorAddressCount}</div>
          <div><strong>Royalty Percentage:</strong> {royaltyInfo.royaltyPercent}%</div>
          <div><strong>Royalty Points:</strong> {royaltyInfo.royaltyPoints}</div>
        </ResultsContainer>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={handleCloseToast}
      >
        <Alert severity={toast.severity} onClose={handleCloseToast}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RoyaltyChecker;
