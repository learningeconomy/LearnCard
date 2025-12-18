---
description: A plugin for interacting with the Ethereum blockchain
---

# Ethereum

## Installation

```bash
pnpm i @learncard/ethereum-plugin
```

## Instantiation

To use this plugin, you must include an `ethereumConfig` object as a part of the LearnCardConfig parameter for `initLearnCard`

```typescript
const learnCard = await initLearncard({ 
    seed: privateKey, 
    // ...
    ethereumConfig: {
        network: 'mainnet',
        infuraProjectId: 'abc123'
    }
});
```



#### network (optional)

The Ethereum network to connect to. This is an ethers [Networkish](https://docs.ethers.io/v5/api/providers/types/#providers-Networkish) type, which can be a [Network](https://docs.ethers.io/v5/api/providers/types/#providers-Network) object, the name of a network as a string, or the chain ID of a network as a number.

Defaults to 'mainnet' if not provided

#### infuraProjectId (optional)

The [Infura](https://infura.io/) project ID that you would like to use to access the Ethereum network.

If not provided, the [default ethers provider](https://docs.ethers.io/v5/api/providers/#providers-getDefaultProvider) will be used.



## Methods

#### getEthereumAddress()

Returns the Ethereum public address associated with this wallet

#### async getBalance(symbolOrAddress)

Returns the token balance for this wallet for the given symbol or token address

`await learnCard.getBalance('ETH')`

* symbolOrAddress - string (optional)
  *   The ERC20 token address for the token you wish to check the balance of

      `learnCard.getBalance('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48') // USDC on mainnet`&#x20;
  *   The token symbol for the token you wish to check the balance of

      `learnCard.getBalance('USDC')`

      * Note: this will only work if the given symbol is recognized.
  * Defaults to 'ETH' if omitted

#### async getBalanceForAddress(walletAddress, symbolOrAddress)

Returns the token balance for the given wallet address for the given symbol/token address

`await learnCard.getBalanceForAddress('0xAddressToCheck', 'DAI')`

* walletAddress - string
  * The public address you wish to check the balance for
* symbolOrAddress - string (optional)
  * Same as[ getBalance's symbolOrAddress](ethereum.md#async-getbalance-symboloraddress)

#### async transferTokens(tokenSymbolOrAddress, amount, toAddress)

Transfers tokens from this wallet to another wallet. Returns the transaction hash.

`await wallet.transferTokens('USDC', 2.2, '0xAddressToSendTo')`

* tokenSymbolOrAddress - string
  * Same as [getBalance's symbolOrAddress](ethereum.md#async-getbalance-symboloraddress)
* amount - number
  * The number of tokens you wish to transfer
* toAddress - string
  * The address that you wish to send tokens to

#### async getGasPrice()

Get the current gas price for the network

`await wallet.getGasPrice()`

#### getCurrentNetwork()

Returns the current Ethereum network (type: [Networkish](ethereum.md#async-getbalance-symboloraddress))

#### changeNetwork(\_network)

Changes the current Ethereum network

* \_network - [Networkish](ethereum.md#async-getbalance-symboloraddress)

#### addInfuraProjectId(infuraProjectId)

Add or change the Infura project ID

* infuraProjectId - string
  * The new infura project ID that you wish to use





####
