import { APP_SPEC as VNS_REGISTRY_APP_SPEC } from "@/clients/VNSRegistryClient";
import { zeroAddress } from "@/contants/accounts";
import { namehash, uint8ArrayToBigInt } from "@/utils/namehash";
import { getAlgorandClients } from "@/wallets";
import algosdk from "algosdk";
import React, { useState } from "react";
import styled from "styled-components";
import { CONTRACT } from "ulujs";

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

const ResultsContainer = styled.div`
  background: var(--background-secondary);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
`;

const ResultItem = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
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
`;

const TreeContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
`;

const TreeNode = styled.div`
  margin-left: 20px;
  position: relative;
  padding: 8px 0;

  &:before {
    content: "";
    position: absolute;
    left: -20px;
    top: 50%;
    width: 20px;
    height: 1px;
    background: var(--border-color);
  }

  &:after {
    content: "";
    position: absolute;
    left: -20px;
    top: -8px;
    bottom: 50%;
    width: 1px;
    background: var(--border-color);
  }

  &:first-child:after {
    display: none;
  }
`;

interface AnalysisResult {
  pattern: string;
  matches: string[];
  hash?: string;
  parentHash?: string;
}

interface NameNode {
  name: string;
  hash: string;
  level: number;
  owner?: string;
}

const NameInspector: React.FC = () => {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [nameHierarchy, setNameHierarchy] = useState<NameNode[]>([]);

  const analyzeName = async () => {
    const name = input.trim();
    if (!name) return;

    const patterns: AnalysisResult[] = [];
    const hierarchy: NameNode[] = [];

    // Build name hierarchy
    const parts = name.split(".");
    let currentName = "";

    // Add root node first
    const rootHash = await namehash("");
    const { algodClient } = getAlgorandClients();
    const getOwner = async (name: string) => {
      const ci = new CONTRACT(
        797607,
        algodClient,
        undefined,
        {
          name: "VNSRegistry",
          desc: "VNSRegistry",
          methods: VNS_REGISTRY_APP_SPEC.contract.methods,
          events: [],
        },
        {
          addr: algosdk.getApplicationAddress(797607),
          sk: new Uint8Array(32),
        }
      );
      const ownerOfR = await ci.ownerOf(await namehash(name, "alphanumeric"));
      console.log(ownerOfR);
      if (!ownerOfR.success) {
        return zeroAddress;
      }
      return ownerOfR.returnValue;
    };
    const rootOwner = await getOwner("");
    console.log("rootOwner", rootOwner);
    hierarchy.push({
      name: "(root)",
      hash: uint8ArrayToBigInt(rootHash).toString(),
      level: 0,
      owner: rootOwner,
    });

    // Process from leaf to root
    for (let i = parts.length - 1; i >= 0; i--) {
      const subParts = parts.slice(i);
      currentName = subParts.join(".");

      const nameHash = await namehash(currentName);
      const owner = await getOwner(currentName);

      hierarchy.push({
        name: currentName,
        hash: uint8ArrayToBigInt(nameHash).toString(),
        level: parts.length - i,
        owner,
      });
    }

    setNameHierarchy(hierarchy);

    // Common naming patterns
    const patternChecks = [
      {
        pattern: "Name starts with 'en'",
        check: (name: string) => name.toLowerCase().startsWith("en"),
      },
      {
        pattern: "Name contains 'voi'",
        check: (name: string) => name.toLowerCase().includes("voi"),
      },
      {
        pattern: "Name ends with numbers",
        check: (name: string) => /\d+$/.test(name),
      },
      {
        pattern: "Name is camel case",
        check: (name: string) => /^[a-z]+[A-Z][a-zA-Z]*$/.test(name),
      },
      {
        pattern: "Name is pascal case",
        check: (name: string) => /^[A-Z][a-zA-Z]*$/.test(name),
      },
    ];

    patternChecks.forEach(({ pattern, check }) => {
      if (check(name)) {
        patterns.push({ pattern, matches: [name] });
      }
    });

    setResults(patterns);
  };

  return (
    <Container>
      <h2>Name Inspector</h2>
      <p>Enter a name to analyze its patterns:</p>

      <InputArea
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter a name to analyze..."
        aria-label="Name input"
      />

      <Button onClick={analyzeName}>Analyze Name</Button>

      {nameHierarchy.length > 0 && (
        <TreeContainer>
          <h3>Name Hierarchy</h3>
          {nameHierarchy.map((node, index) => (
            <TreeNode
              key={index}
              style={{ marginLeft: `${node.level * 20}px` }}
            >
              <div>{node.name}</div>
              <div
                style={{ fontSize: "0.8em", color: "var(--text-secondary)" }}
              >
                Hash: {node.hash}
              </div>
              {node.owner && (
                <div
                  style={{ fontSize: "0.8em", color: "var(--text-secondary)" }}
                >
                  Owner: {node.owner}
                </div>
              )}
            </TreeNode>
          ))}
        </TreeContainer>
      )}

      {results.length > 0 && (
        <ResultsContainer>
          {results.map((result, index) => (
            <ResultItem key={index}>
              <h3>{result.pattern}</h3>
              <ul>
                {result.matches.map((match, i) => (
                  <li key={i}>{match}</li>
                ))}
              </ul>
            </ResultItem>
          ))}
        </ResultsContainer>
      )}
    </Container>
  );
};

export default NameInspector;
