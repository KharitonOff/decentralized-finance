
import { IStakeEntry, IWalletReputation } from "./interfaces";

import { p2pStakingPoolAbi } from "../constants"
import { EthereumService } from "../ethereum/ethereum.service";
import { IComplianceInterface } from "./compliance.interface";
import { StakingPool } from "./staking-pool";

const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDER_URL));

export enum VOTING_DIRECTION {
    up = 1,
    down = 2
} 
export class ComplianceService implements IComplianceInterface {
    
    // checke die legimität des posts an sich --> 24 h monatlich 1 h weniger bis 2 h

    public static walletReputations: IWalletReputation[] = []

    public static async stakeETHBeforeMakingATransaction(walletAddress: string, amount: number): Promise<string> {

        const reputation = ComplianceService.walletReputations.filter((entry: IWalletReputation) => entry.walletAddress === walletAddress )[0].reputation

        const currentEtherPriceInDAI = await EthereumService.getEtherPriceInDAI()

        const stakingAmount = 0.01 // e.g. Ether

        const p2pStakingPoolAddress = 'to be entered after deployment on mainnet';

        const p2pStakingPoolContract = new web3.eth.Contract(p2pStakingPoolAbi, p2pStakingPoolAddress);
        const referredTransactioId = StakingPool.stakeETHBeforeMakingATransaction()

        return referredTransactioId
    }

    public static repayStakedETHToSuccessfulContributors(referredTransactioId: string) {
        // tbd
    }

    public static voteOnTransaction(walletAddress: string, referredTransactioId: string, votingDirection: VOTING_DIRECTION) {
        // tbd
    }



}