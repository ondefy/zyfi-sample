import { Chain, createClient } from 'viem'
import { zkSyncSepoliaTestnet } from 'viem/zksync'
import { createConfig, http } from 'wagmi'

export const abstractTestnet: Chain = {
  id: 11_124,
  name: 'Abstract Testnet',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://api.testnet.abs.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://explorer.testnet.abs.xyz',
    },
  },
  custom: zkSyncSepoliaTestnet.custom,
  formatters: zkSyncSepoliaTestnet.formatters,
  serializers: zkSyncSepoliaTestnet.serializers,
}

export default createConfig({
  chains: [abstractTestnet] as [Chain, ...Chain[]],
  client({ chain }) {
    return createClient({ chain, transport: http() })
  },
})
