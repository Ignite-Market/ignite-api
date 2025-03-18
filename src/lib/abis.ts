/**
 * Fixed product market maker ABI.
 */
export const FPMM_ABI = [
  {
    'constant': true,
    'inputs': [
      {
        'name': 'interfaceId',
        'type': 'bytes4'
      }
    ],
    'name': 'supportsInterface',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'treasuryPercent',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'spender',
        'type': 'address'
      },
      {
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'approve',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'withdrawFees',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'feesWithdrawableBy',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'totalSupply',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'sender',
        'type': 'address'
      },
      {
        'name': 'recipient',
        'type': 'address'
      },
      {
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'transferFrom',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'percentUL',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'canTrade',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'spender',
        'type': 'address'
      },
      {
        'name': 'addedValue',
        'type': 'uint256'
      }
    ],
    'name': 'increaseAllowance',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'investmentAmount',
        'type': 'uint256'
      },
      {
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'name': 'minOutcomeTokensToBuy',
        'type': 'uint256'
      }
    ],
    'name': 'buy',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'returnAmount',
        'type': 'uint256'
      },
      {
        'name': 'outcomeIndex',
        'type': 'uint256'
      }
    ],
    'name': 'calcSellAmount',
    'outputs': [
      {
        'name': 'outcomeTokenSellAmount',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'conditionalTokens',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'treasury',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'balanceOf',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'collectedFees',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'positionIds',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'spender',
        'type': 'address'
      },
      {
        'name': 'subtractedValue',
        'type': 'uint256'
      }
    ],
    'name': 'decreaseAllowance',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'recipient',
        'type': 'address'
      },
      {
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'transfer',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'collateralToken',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'fundingThreshold',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'operator',
        'type': 'address'
      },
      {
        'name': 'from',
        'type': 'address'
      },
      {
        'name': 'ids',
        'type': 'uint256[]'
      },
      {
        'name': 'values',
        'type': 'uint256[]'
      },
      {
        'name': 'data',
        'type': 'bytes'
      }
    ],
    'name': 'onERC1155BatchReceived',
    'outputs': [
      {
        'name': '',
        'type': 'bytes4'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'returnAmount',
        'type': 'uint256'
      },
      {
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'name': 'maxOutcomeTokensToSell',
        'type': 'uint256'
      }
    ],
    'name': 'sell',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'addedFunds',
        'type': 'uint256'
      },
      {
        'name': 'distributionHint',
        'type': 'uint256[]'
      }
    ],
    'name': 'addFunding',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'conditionIds',
    'outputs': [
      {
        'name': '',
        'type': 'bytes32'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'owner',
        'type': 'address'
      },
      {
        'name': 'spender',
        'type': 'address'
      }
    ],
    'name': 'allowance',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'fee',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'sharesToBurn',
        'type': 'uint256'
      }
    ],
    'name': 'removeFunding',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'operator',
        'type': 'address'
      },
      {
        'name': 'from',
        'type': 'address'
      },
      {
        'name': 'id',
        'type': 'uint256'
      },
      {
        'name': 'value',
        'type': 'uint256'
      },
      {
        'name': 'data',
        'type': 'bytes'
      }
    ],
    'name': 'onERC1155Received',
    'outputs': [
      {
        'name': '',
        'type': 'bytes4'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'investmentAmount',
        'type': 'uint256'
      },
      {
        'name': 'outcomeIndex',
        'type': 'uint256'
      }
    ],
    'name': 'calcBuyAmount',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'fundingAmountTotal',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'funder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'amountsAdded',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'sharesMinted',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMFundingAdded',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'funder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'amountsRemoved',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'collateralRemovedFromFeePool',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'sharesBurnt',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMFundingRemoved',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'buyer',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'investmentAmount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'feeAmount',
        'type': 'uint256'
      },
      {
        'indexed': true,
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'outcomeTokensBought',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMBuy',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'seller',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'returnAmount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'feeAmount',
        'type': 'uint256'
      },
      {
        'indexed': true,
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'outcomeTokensSold',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMSell',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'from',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'to',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'Transfer',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'owner',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'spender',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'Approval',
    'type': 'event'
  }
];

/**
 * Fixed product market maker factory ABI.
 */
export const FPMM_FACTORY_ABI = [
  {
    'constant': true,
    'inputs': [],
    'name': 'implementationMaster',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'consData',
        'type': 'bytes'
      }
    ],
    'name': 'cloneConstructor',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'conditionalTokens',
        'type': 'address'
      },
      {
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'name': 'conditionIds',
        'type': 'bytes32[]'
      },
      {
        'name': 'fee',
        'type': 'uint256'
      },
      {
        'name': 'treasuryPercent',
        'type': 'uint256'
      },
      {
        'name': 'treasury',
        'type': 'address'
      },
      {
        'name': 'fundingThreshold',
        'type': 'uint256'
      }
    ],
    'name': 'createFixedProductMarketMaker',
    'outputs': [
      {
        'name': '',
        'type': 'address'
      }
    ],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [],
    'name': 'fundingThreshold',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'creator',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'fixedProductMarketMaker',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'conditionalTokens',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'conditionIds',
        'type': 'bytes32[]'
      },
      {
        'indexed': false,
        'name': 'fee',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'treasuryPercent',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'treasury',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'fundingThreshold',
        'type': 'uint256'
      }
    ],
    'name': 'FixedProductMarketMakerCreation',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'funder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'amountsAdded',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'sharesMinted',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMFundingAdded',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'funder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'amountsRemoved',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'collateralRemovedFromFeePool',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'sharesBurnt',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMFundingRemoved',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'buyer',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'investmentAmount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'feeAmount',
        'type': 'uint256'
      },
      {
        'indexed': true,
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'outcomeTokensBought',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMBuy',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'seller',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'returnAmount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'feeAmount',
        'type': 'uint256'
      },
      {
        'indexed': true,
        'name': 'outcomeIndex',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'outcomeTokensSold',
        'type': 'uint256'
      }
    ],
    'name': 'FPMMSell',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'target',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'clone',
        'type': 'address'
      }
    ],
    'name': 'CloneCreated',
    'type': 'event'
  }
];

/**
 * Conditionals token ABI.
 */
export const CONDITIONAL_TOKEN_ABI = [
  {
    'constant': true,
    'inputs': [
      {
        'name': 'owner',
        'type': 'address'
      },
      {
        'name': 'id',
        'type': 'uint256'
      }
    ],
    'name': 'balanceOf',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'name': 'indexSets',
        'type': 'uint256[]'
      }
    ],
    'name': 'redeemPositions',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'interfaceId',
        'type': 'bytes4'
      }
    ],
    'name': 'supportsInterface',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': '',
        'type': 'bytes32'
      },
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'payoutNumerators',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'from',
        'type': 'address'
      },
      {
        'name': 'to',
        'type': 'address'
      },
      {
        'name': 'ids',
        'type': 'uint256[]'
      },
      {
        'name': 'values',
        'type': 'uint256[]'
      },
      {
        'name': 'data',
        'type': 'bytes'
      }
    ],
    'name': 'safeBatchTransferFrom',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'name': 'collectionId',
        'type': 'bytes32'
      }
    ],
    'name': 'getPositionId',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'owners',
        'type': 'address[]'
      },
      {
        'name': 'ids',
        'type': 'uint256[]'
      }
    ],
    'name': 'balanceOfBatch',
    'outputs': [
      {
        'name': '',
        'type': 'uint256[]'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'name': 'partition',
        'type': 'uint256[]'
      },
      {
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'splitPosition',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'oracle',
        'type': 'address'
      },
      {
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      }
    ],
    'name': 'getConditionId',
    'outputs': [
      {
        'name': '',
        'type': 'bytes32'
      }
    ],
    'payable': false,
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'name': 'indexSet',
        'type': 'uint256'
      }
    ],
    'name': 'getCollectionId',
    'outputs': [
      {
        'name': '',
        'type': 'bytes32'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'name': 'partition',
        'type': 'uint256[]'
      },
      {
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'mergePositions',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'operator',
        'type': 'address'
      },
      {
        'name': 'approved',
        'type': 'bool'
      }
    ],
    'name': 'setApprovalForAll',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'name': 'payouts',
        'type': 'uint256[]'
      }
    ],
    'name': 'reportPayouts',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'conditionId',
        'type': 'bytes32'
      }
    ],
    'name': 'getOutcomeSlotCount',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'oracle',
        'type': 'address'
      },
      {
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      }
    ],
    'name': 'prepareCondition',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': '',
        'type': 'bytes32'
      }
    ],
    'name': 'payoutDenominator',
    'outputs': [
      {
        'name': '',
        'type': 'uint256'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': true,
    'inputs': [
      {
        'name': 'owner',
        'type': 'address'
      },
      {
        'name': 'operator',
        'type': 'address'
      }
    ],
    'name': 'isApprovedForAll',
    'outputs': [
      {
        'name': '',
        'type': 'bool'
      }
    ],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'constant': false,
    'inputs': [
      {
        'name': 'from',
        'type': 'address'
      },
      {
        'name': 'to',
        'type': 'address'
      },
      {
        'name': 'id',
        'type': 'uint256'
      },
      {
        'name': 'value',
        'type': 'uint256'
      },
      {
        'name': 'data',
        'type': 'bytes'
      }
    ],
    'name': 'safeTransferFrom',
    'outputs': [],
    'payable': false,
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'name': 'oracle',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      }
    ],
    'name': 'ConditionPreparation',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'name': 'oracle',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'payoutNumerators',
        'type': 'uint256[]'
      }
    ],
    'name': 'ConditionResolution',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'stakeholder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'partition',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'PositionSplit',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'stakeholder',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'partition',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'amount',
        'type': 'uint256'
      }
    ],
    'name': 'PositionsMerge',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'redeemer',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'collateralToken',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'parentCollectionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'conditionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'name': 'indexSets',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'payout',
        'type': 'uint256'
      }
    ],
    'name': 'PayoutRedemption',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'operator',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'from',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'to',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'id',
        'type': 'uint256'
      },
      {
        'indexed': false,
        'name': 'value',
        'type': 'uint256'
      }
    ],
    'name': 'TransferSingle',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'operator',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'from',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'to',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'ids',
        'type': 'uint256[]'
      },
      {
        'indexed': false,
        'name': 'values',
        'type': 'uint256[]'
      }
    ],
    'name': 'TransferBatch',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'name': 'owner',
        'type': 'address'
      },
      {
        'indexed': true,
        'name': 'operator',
        'type': 'address'
      },
      {
        'indexed': false,
        'name': 'approved',
        'type': 'bool'
      }
    ],
    'name': 'ApprovalForAll',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': false,
        'name': 'value',
        'type': 'string'
      },
      {
        'indexed': true,
        'name': 'id',
        'type': 'uint256'
      }
    ],
    'name': 'URI',
    'type': 'event'
  }
];

/**
 * Oracle ABI.
 */
export const ORACLE_ABI = [
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_admin',
        'type': 'address'
      },
      {
        'internalType': 'address',
        'name': '_conditionalTokens',
        'type': 'address'
      },
      {
        'internalType': 'address',
        'name': '_verification',
        'type': 'address'
      },
      {
        'internalType': 'uint256',
        'name': '_minVotes',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'previousAdminRole',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'newAdminRole',
        'type': 'bytes32'
      }
    ],
    'name': 'RoleAdminChanged',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'sender',
        'type': 'address'
      }
    ],
    'name': 'RoleGranted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'sender',
        'type': 'address'
      }
    ],
    'name': 'RoleRevoked',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      {
        'indexed': true,
        'internalType': 'address',
        'name': 'voter',
        'type': 'address'
      },
      {
        'indexed': true,
        'internalType': 'bytes32',
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'indexed': false,
        'internalType': 'uint256',
        'name': 'outcomeIdx',
        'type': 'uint256'
      }
    ],
    'name': 'VoteSubmitted',
    'type': 'event'
  },
  {
    'inputs': [],
    'name': 'DEFAULT_ADMIN_ROLE',
    'outputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'VOTER_ROLE',
    'outputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'conditionalTokens',
    'outputs': [
      {
        'internalType': 'contract IConditionalTokens',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'components': [
          {
            'internalType': 'bytes32[]',
            'name': 'merkleProof',
            'type': 'bytes32[]'
          },
          {
            'components': [
              {
                'internalType': 'bytes32',
                'name': 'attestationType',
                'type': 'bytes32'
              },
              {
                'internalType': 'bytes32',
                'name': 'sourceId',
                'type': 'bytes32'
              },
              {
                'internalType': 'uint64',
                'name': 'votingRound',
                'type': 'uint64'
              },
              {
                'internalType': 'uint64',
                'name': 'lowestUsedTimestamp',
                'type': 'uint64'
              },
              {
                'components': [
                  {
                    'internalType': 'string',
                    'name': 'url',
                    'type': 'string'
                  },
                  {
                    'internalType': 'string',
                    'name': 'postprocessJq',
                    'type': 'string'
                  },
                  {
                    'internalType': 'string',
                    'name': 'abi_signature',
                    'type': 'string'
                  }
                ],
                'internalType': 'struct IJsonApi.RequestBody',
                'name': 'requestBody',
                'type': 'tuple'
              },
              {
                'components': [
                  {
                    'internalType': 'bytes',
                    'name': 'abi_encoded_data',
                    'type': 'bytes'
                  }
                ],
                'internalType': 'struct IJsonApi.ResponseBody',
                'name': 'responseBody',
                'type': 'tuple'
              }
            ],
            'internalType': 'struct IJsonApi.Response',
            'name': 'data',
            'type': 'tuple'
          }
        ],
        'internalType': 'struct IJsonApi.Proof[]',
        'name': 'proofs',
        'type': 'tuple[]'
      },
      {
        'internalType': 'bool',
        'name': 'finalize',
        'type': 'bool'
      }
    ],
    'name': 'finalizeQuestion',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      }
    ],
    'name': 'getRoleAdmin',
    'outputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'grantRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'hasRole',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      },
      {
        'internalType': 'address',
        'name': '',
        'type': 'address'
      }
    ],
    'name': 'hasVoted',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'internalType': 'uint256',
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      },
      {
        'internalType': 'string[]',
        'name': 'urlAr',
        'type': 'string[]'
      },
      {
        'internalType': 'string[]',
        'name': 'postprocessJqAr',
        'type': 'string[]'
      },
      {
        'internalType': 'uint256',
        'name': 'consensusPercent',
        'type': 'uint256'
      },
      {
        'internalType': 'uint256',
        'name': 'resolutionTime',
        'type': 'uint256'
      },
      {
        'internalType': 'bool',
        'name': 'automatic',
        'type': 'bool'
      }
    ],
    'name': 'initializeQuestion',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'name': 'jqProcessed',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'name': 'jqToQuestionId',
    'outputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'minVotes',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'noOfVoters',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      }
    ],
    'name': 'question',
    'outputs': [
      {
        'internalType': 'enum IgniteOracle.Status',
        'name': 'status',
        'type': 'uint8'
      },
      {
        'internalType': 'bool',
        'name': 'automatic',
        'type': 'bool'
      },
      {
        'internalType': 'uint256',
        'name': 'outcomeSlotCount',
        'type': 'uint256'
      },
      {
        'internalType': 'uint256',
        'name': 'apiSources',
        'type': 'uint256'
      },
      {
        'internalType': 'uint256',
        'name': 'consensusPercent',
        'type': 'uint256'
      },
      {
        'internalType': 'uint256',
        'name': 'resolutionTime',
        'type': 'uint256'
      },
      {
        'internalType': 'uint256',
        'name': 'winnerIdx',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '',
        'type': 'bytes32'
      },
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'name': 'questionOutcomeVotes',
    'outputs': [
      {
        'internalType': 'uint256',
        'name': '',
        'type': 'uint256'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'renounceRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'role',
        'type': 'bytes32'
      },
      {
        'internalType': 'address',
        'name': 'account',
        'type': 'address'
      }
    ],
    'name': 'revokeRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes4',
        'name': 'interfaceId',
        'type': 'bytes4'
      }
    ],
    'name': 'supportsInterface',
    'outputs': [
      {
        'internalType': 'bool',
        'name': '',
        'type': 'bool'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'verification',
    'outputs': [
      {
        'internalType': 'contract IJsonApiVerification',
        'name': '',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': 'questionId',
        'type': 'bytes32'
      },
      {
        'internalType': 'uint256',
        'name': 'outcomeIdx',
        'type': 'uint256'
      }
    ],
    'name': 'vote',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];

/**
 * Collateral token ABI.
 */
export const COLLATERAL_TOKEN_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'spender',
        type: 'address'
      },
      {
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'sender',
        type: 'address'
      },
      {
        name: 'recipient',
        type: 'address'
      },
      {
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'transferFrom',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'spender',
        type: 'address'
      },
      {
        name: 'addedValue',
        type: 'uint256'
      }
    ],
    name: 'increaseAllowance',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'account',
        type: 'address'
      },
      {
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mint',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: 'account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'account',
        type: 'address'
      }
    ],
    name: 'addMinter',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'renounceMinter',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'spender',
        type: 'address'
      },
      {
        name: 'subtractedValue',
        type: 'uint256'
      }
    ],
    name: 'decreaseAllowance',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'account',
        type: 'address'
      },
      {
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'faucetMint',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'recipient',
        type: 'address'
      },
      {
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: 'account',
        type: 'address'
      }
    ],
    name: 'isMinter',
    outputs: [
      {
        name: '',
        type: 'bool'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'deposit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      {
        name: 'owner',
        type: 'address'
      },
      {
        name: 'spender',
        type: 'address'
      }
    ],
    name: 'allowance',
    outputs: [
      {
        name: '',
        type: 'uint256'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'account',
        type: 'address'
      }
    ],
    name: 'MinterAdded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'account',
        type: 'address'
      }
    ],
    name: 'MinterRemoved',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'owner',
        type: 'address'
      },
      {
        indexed: true,
        name: 'spender',
        type: 'address'
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  }
];
