# Hardhat Guide

## What is Hardhat?
Hardhat is a complete development environment for Ethereum. It is **not** just a testing library. It handles:
-   **Compilation**: Turning Solidity (`.sol`) into artifacts (ABI/Bytecode).
-   **Deployment**: Scripts to put your contracts on a network.
-   **Testing**: A robust environment to verify your code.
-   **Debugging**: Detailed error messages and stack traces.

## Networks: Local vs. Sepolia

### 1. Hardhat Network (Default) - "The Matrix"
When you run `npx hardhat test`, Hardhat creates a **temporary, local blockchain** in memory.
-   **It assumes** the existence of the blockchain just for the commands you run.
-   **It is empty** at the start of every test run.
-   **It is instant**: No waiting for block confirmations.
-   **It is free**: No real or testnet ETH required.
-   **It is distinct**: It has **nothing** to do with Sepolia.

**Use this for:** Rapid development, unit tests, checking logic.

### 2. Localhost Node - "The Local Server"
You can spin up a persistent local blockchain that mimics a real node:
```bash
npx hardhat node
```
This gives you 10 accounts with 10,000 fake ETH. Your React app can connect to this (via MetaMask, switching network to Localhost 8545) for testing the UI without spending data.

### 3. Sepolia (Public Testnet) - "The Staging Environment"
You can still use Hardhat to interact with Sepolia, but you must be explicit.
To deploy to Sepolia, you would run:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```
This **connects** to the real Sepolia network using the URL and Private Key in your `.env` file.

## Why use Hardhat?
1.  **Speed**: You can run 100 tests in seconds locally vs. waitings minutes for Sepolia confirmations.
2.  **Debugging**: If a transaction fails on Sepolia, you just get "execution reverted". On Hardhat, you get the exact line number in your Solidity code that failed.
3.  **Control**: You can manipulate time (fast forward blocks), impersonate other accounts, and reset the state instantly.
