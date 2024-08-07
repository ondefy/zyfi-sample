'use client'

import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { formatUnits } from 'viem'
import { useAccount, useBalance } from 'wagmi'
import { Flip, ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { ERC20_TOKEN_ADDRESS, executeContractFunction } from '../utils/zyfi'

const Home: NextPage = () => {
  const [isRunningTx, setIsRunningTx] = useState<boolean>(false)
  const [dstWallet, setDstWallet] = useState<string>('0xD8cdF482eE16787840F1819B4a48910090b728a4')
  const [amount, setAmount] = useState<string>('1')
  const { address: walletAddress, chain, chainId } = useAccount()

  const {
    data: balance,
    refetch: refetchBalance,
    isFetching: isFetchingBalance,
  } = useBalance({
    chainId,
    address: walletAddress,
    token: ERC20_TOKEN_ADDRESS,
  })

  const onButtonClick = async () => {
    try {
      setIsRunningTx(true)
      const hash = await executeContractFunction(chain, walletAddress, dstWallet as `0x${string}`, amount)
      const CustomToastWithLink = () => (
        <Link href={`${chain?.blockExplorers?.default.url}/tx/${hash}`} target="_blank" style={{ textDecoration: 'none', color: 'white' }}>
          Successfully transferred {amount} token(s)! Click to view on etherscan
        </Link>
      )
      toast.success(CustomToastWithLink)
      await refetchBalance()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsRunningTx(false)
    }
  }

  return (
    <div>
      <Head>
        <title>Zyfi API Sample</title>
        <meta content="" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <ToastContainer position="bottom-center" pauseOnHover theme="dark" transition={Flip} />

      <main style={{ width: '600px', margin: '0 auto' }}>
        <div style={{ float: 'right' }}>
          <ConnectButton />
        </div>
        <div style={{ marginTop: '25px', width: '50%' }}>
          <div style={{ float: 'right' }}>
            to: <input type="text" value={dstWallet} onChange={e => setDstWallet(e.target.value)} size={44} />
          </div>
          <div style={{ marginTop: '25px', marginBottom: '25px', float: 'right' }}>
            amount: <input type="text" value={amount} onChange={e => setAmount(e.target.value)} size={44} />
          </div>
          <div style={{ marginTop: '25px' }}>
            <button onClick={onButtonClick} style={{ padding: '10px' }}>
              transfer
            </button>
          </div>
        </div>
        <div style={{ marginTop: '50px', width: '50%' }}>
          <span>
            <b>💰 MockERC20 Balance: &nbsp;</b>
            {balance ? Number(formatUnits(balance.value, 18)).toFixed(5) : '-'}
          </span>
        </div>
        {isRunningTx && (
          <div style={{ marginTop: '25px', textAlign: 'center' }}>
            <img src="/spinner.gif" width={25} />
          </div>
        )}
      </main>
    </div>
  )
}

export default Home
