import { BigNumber, BigNumberish } from 'ethers'
import { toUtf8Bytes } from 'ethers/lib/utils'
import { useRouter } from 'next/router'
import { FC, useEffect, useState } from 'react'
import { Dialog } from 'ui'
import DialogContent from 'ui/dialog/DialogContent'
import { useContract, useSigner } from 'wagmi'
import { getBuiltGraphSDK } from '../../.graphclient'
import FuroStreamABI from '../../abis/FuroStream.json'

interface Props {
  stream: Stream
  transactions: Transaction[]
}

interface Stream {
  id: string
  status: string
  amount: string
  withdrawnAmount: string
  expiresAt: string
  startedAt: string
  token: Token
}

interface Transaction {
  id: string
  type: string
  amount: string
  toBentoBox: false
  withdrawnAmount: string
  createdAtBlock: string
  createdAtTimestamp: string
  token: Token
  to: User
}

interface User {
  id: string
}

interface Token {
  id: string
  symbol: string
  name: string
  decimals: string
}

const Streams: FC<Props> = (props) => {
  const router = useRouter()
  const id = router.query.id as string
  let { stream, transactions } = props
  let [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState<number>()
  const [balance, setBalance] = useState(null)
  const [{ data, error, loading }, getSigner] = useSigner()
  const contract = useContract({
    addressOrName: '0x511D5aef6eb2eFDf71b98B4261Bbe68CC0A94Cd4',
    contractInterface: FuroStreamABI,
    signerOrProvider: data,
  })

  function closeModal() {
    setIsOpen(false)
  }

  function openModal() {
    setIsOpen(true)
  }

  useEffect(() => {
    if (!data || !contract || !stream.id) {
      return
    }
    const fetchBalance = async () => {
      const result = await contract.streamBalanceOf(stream.id)
      console.log(result)
      const balance = result.recipientBalance as BigNumber
      setBalance(balance.toNumber())

    }
    fetchBalance()
  }, [contract, stream.id, data])

  async function withdraw() {
    if (amount) {
      const address = await data.getAddress()
      contract.withdrawFromStream(stream.id, amount, address, true, '0x')
    } else {
      console.log('insufficient amount')
    }
  }

  return (
    <>
      <div className="px-2 pt-16">
        <h1 className="py-4 text-2xl font-bold">Stream</h1>
        <div className="grid gap-2">
          {stream ? (
            <div key={stream.id}>
              <div>Status: {stream.status}</div>
              <div>
                Total: {stream.amount} {``} {stream.token.symbol}{' '}
              </div>
              <div>
                Withdrawn amount: {stream.withdrawnAmount} {stream.token.symbol}{' '}
              </div>
              <div>
                Balance: {balance} {stream.token.symbol}{' '}
              </div>
              <div>
                Started: {} {new Date(parseInt(stream.startedAt) * 1000).toLocaleString()}{' '}
              </div>
              <div>
                Expires: {} {new Date(parseInt(stream.expiresAt) * 1000).toLocaleString()}{' '}
              </div>
            </div>
          ) : (
            <div>
              <i>No stream found..</i>
            </div>
          )}
        </div>

        <button type="button" onClick={openModal} className="font-medium text-white">
          Withdraw
        </button>
        <Dialog open={isOpen} onClose={closeModal}>
          <DialogContent>
            {/* TODO: replace with Select component from ui package */}

            <div className="text-blue-600">
              <div>
                How much do you want to withdraw?
                <input
                  type={'number'}
                  defaultValue={500000}
                  onChange={(e) => setAmount(parseInt(e.target.value))}
                ></input>
              </div>

              <button onClick={withdraw}>Withdraw</button>
            </div>
          </DialogContent>
        </Dialog>
        <h2 className="py-4 text-2xl font-bold">Transactions</h2>
        <div className="grid gap-2">
          {transactions.length ? (
            Object.values(transactions).map((transaction) => (
              <div key={transaction.id}>
                {transaction.type} {``}
                {transaction.amount} {``} {transaction.token.symbol} {``}
                {transaction.to.id} {``}
                {new Date(parseInt(transaction.createdAtTimestamp) * 1000).toLocaleString()} {``}
              </div>
            ))
          ) : (
            <div>
              <i>No transactions found..</i>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Streams

export async function getServerSideProps({ query }) {
  const sdk = await getBuiltGraphSDK()
  const stream = (await sdk.Stream({ id: query.id })).stream
  const transactions = (await sdk.Transactions({ id: query.id })).transactions
  return {
    props: {
      stream,
      transactions,
    },
  }
}