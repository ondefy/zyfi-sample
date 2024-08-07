import { getWalletClient, getTransactionCount, waitForTransactionReceipt } from '@wagmi/core'
import { Chain, encodeFunctionData, erc20Abi, parseEther } from 'viem'
import { eip712WalletActions } from 'viem/zksync'

import config from '../wagmiConfig'

// A mock token that will be used both for paying gas and as an example for transfer transactions
export const ERC20_TOKEN_ADDRESS = '0xFbAa6056db57fe4611BE0e394f31Fda69E55aED5'

export async function executeContractFunction(chain: Chain, fromWallet: `0x${string}`, toWallet: `0x${string}`, amount: string): Promise<`0x${string}`> {

  // Encode the function data for the transfer
  const encodedFunctionData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [toWallet, parseEther(amount)],
  })

  // Prepare the API request payload
  const apiRequestData = {
    chainId: chain.id,
    feeTokenAddress: ERC20_TOKEN_ADDRESS,
    txData: {
      from: fromWallet,
      to: ERC20_TOKEN_ADDRESS,
      data: encodedFunctionData,
      value: '0',
    },
  }

  // Fetch the response from the Zyfi API
  const response = await fetch('https://api.zyfi.org/api/erc20_paymaster/v1', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(apiRequestData),
  })
  const apiResponseData = await response.json()

  // Get the wallet client and extend it with EIP-712 wallet actions
  const zkSyncWalletClient = (await getWalletClient(config)).extend(eip712WalletActions())
  const nonce = await getTransactionCount(config, { address: fromWallet })

  // Prepare the transaction data for the paymaster
  const paymasterTxData = {
    account: fromWallet,
    to: ERC20_TOKEN_ADDRESS,
    value: BigInt(0),
    chain,
    gas: BigInt(apiResponseData.gasLimit),
    gasPerPubdata: BigInt(apiResponseData.txData.customData.gasPerPubdata),
    maxFeePerGas: BigInt(apiResponseData.txData.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(0),
    paymaster: apiResponseData.txData.customData.paymasterParams.paymaster,
    paymasterInput: apiResponseData.txData.customData.paymasterParams.paymasterInput,
    data: apiResponseData.txData.data,
    nonce,
  }

  // Send the transaction and wait for the receipt
  // @ts-ignore
  const hash = await zkSyncWalletClient.sendTransaction(paymasterTxData)
  await waitForTransactionReceipt(config, { hash })

  return hash
}
