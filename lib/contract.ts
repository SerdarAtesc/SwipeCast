import { createPublicClient, http } from 'viem'
import type { WalletClient } from 'viem'
import { base } from 'viem/chains'

// Contract address (live contract)
export const GAME_SCORE_CONTRACT_ADDRESS = '0x1722ef0c99edf0d5aaee1309006b192e8d64698e' as const

// Contract ABI - sadece ihtiyacımız olan fonksiyonlar
export const GAME_SCORE_ABI = [
  {
    name: 'incrementScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'appId', type: 'string' }],
    outputs: []
  },
  {
    name: 'getAllAppsSortedByScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: '',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'string' },
          { name: 'score', type: 'uint256' },
          { name: 'updatedAt', type: 'uint256' }
        ]
      }
    ]
  },
  {
    name: 'ScoreIncremented',
    type: 'event',
    inputs: [
      { name: 'appId', type: 'string', indexed: true },
      { name: 'newScore', type: 'uint256', indexed: false }
    ]
  }
] as const

// Public client for reading from contract
export const publicClient = createPublicClient({
  chain: base,
  transport: http()
})

// Interface for score data
export interface ContractScore {
  appId: string
  score: bigint
  updatedAt?: bigint
}

// Game scores interface (replacing Supabase GameScore)
export interface GameScore {
  id: string
  app_id?: string
  app_name: string
  app_domain: string
  category: string
  score: number
  wins: number
  created_at: string
  updated_at: string
}

// Function to increment score on contract
export async function incrementScoreOnContract(appId: string, walletClient: WalletClient) {
  try {
    if (!walletClient.account) {
      throw new Error('Wallet account not found')
    }

    const hash = await walletClient.writeContract({
      address: GAME_SCORE_CONTRACT_ADDRESS,
      abi: GAME_SCORE_ABI,
      functionName: 'incrementScore',
      args: [appId],
      chain: base,
      account: walletClient.account
    })
    
    console.log('Transaction hash:', hash)
    
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('Transaction confirmed:', receipt)
    
    return { success: true, hash, receipt }
  } catch (error) {
    console.error('Error incrementing score on contract:', error)
    return { success: false, error }
  }
}

// Function to get multiple scores from contract (by app IDs)
export async function getScoresFromContract(appIds: string[]): Promise<ContractScore[]> {
  try {
    const scores = await Promise.all(
      appIds.map(async (appId) => {
        try {
          const score = await getScoreFromContract(appId);
          return { appId, score };
        } catch (error) {
          console.error(`Error getting score for ${appId}:`, error);
          return { appId, score: BigInt(0) };
        }
      })
    );

    return scores;
  } catch (error) {
    console.error('Error getting scores from contract:', error);
    return [];
  }
}

// Function to get all apps sorted by score from contract
export async function getAllAppsSortedByScore(): Promise<{appId: string, score: bigint}[]> {
  try {
    console.log('Getting all apps sorted by score from contract...')

    const result = await publicClient.readContract({
      address: GAME_SCORE_CONTRACT_ADDRESS,
      abi: GAME_SCORE_ABI,
      functionName: 'getAllAppsSortedByScore'
    }) as readonly { id: string; score: bigint; updatedAt: bigint; }[]

    console.log('Contract result:', result)

    // AppScore struct array'ini parse et ve dummy data'ları filtrele
    const dummyIds = [
      "31e222ce-f61c-4593-95c9-9ab187ffb5c4",
      "31e722ce-f61c-4593-95c9-9ab187ffb5c4"
    ]

    const appScores = result
      .filter((item) => !dummyIds.includes(item.id)) // Dummy data'ları filtrele
      .map((item) => ({
        appId: item.id,
        score: item.score,
        updatedAt: item.updatedAt
      }))

    console.log(`Found ${appScores.length} real apps with scores from contract (filtered out ${result.length - appScores.length} dummy entries)`)
    return appScores
  } catch (error) {
    console.error('Error getting apps sorted by score from contract:', error)
    return []
  }
}

// Function to get single score from contract
export async function getScoreFromContract(appId: string): Promise<bigint> {
  try {
    console.log('Getting score for appId:', appId)

    // getAllAppsSortedByScore'dan tüm listeyi al ve bu app'i bul
    const allScores = await getAllAppsSortedByScore()
    const appScore = allScores.find(item => item.appId === appId)

    const score = appScore ? appScore.score : BigInt(0)
    console.log(`Score for ${appId}:`, score)
    return score
  } catch (error) {
    console.log(`Failed to get score for ${appId}:`, (error as Error).message)
    return BigInt(0)
  }
}
