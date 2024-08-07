import { getWalletClient, getTransactionCount, waitForTransactionReceipt } from '@wagmi/core'
import { Chain, encodeFunctionData, erc20Abi, parseEther } from 'viem'
import { eip712WalletActions } from 'viem/zksync'

import config from '../wagmiConfig'

export const ERC2O_TOKEN_ADDRESS = '0xFbAa6056db57fe4611BE0e394f31Fda69E55aED5'

export async function executeContractFunction(chain: Chain, fromWallet: `0x${string}`, toWallet: `0x${string}`, amount: string): Promise<`0x${string}`> {
  
  const encodedFunctionData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [toWallet, parseEther(amount)],
  })

  const apiRequestData = {
    chainId: chain.id,
    feeTokenAddress: ERC2O_TOKEN_ADDRESS,
    txData: {
      from: fromWallet,
      to: ERC2O_TOKEN_ADDRESS,
      data: encodedFunctionData,
      value: '0',
    },
  }
  const responseData = await fetch('https://api.zyfi.org/api/erc20_paymaster/v1', {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify(apiRequestData),
  })
  const apiResponseData = await responseData.json()

  const zkSyncWalletClient = (await getWalletClient(config)).extend(eip712WalletActions())
  const nonce = await getTransactionCount(config, { address: fromWallet })

  const paymasterTxData = {
    account: fromWallet,
    to: ERC2O_TOKEN_ADDRESS,
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
  // @ts-ignore
  const hash = await zkSyncWalletClient.sendTransaction(paymasterTxData)
  await waitForTransactionReceipt(config, { hash })
  return hash
}
