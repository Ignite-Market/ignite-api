/**
 * Fixed product market maker ABI.
 */
export const FPMM_ABI = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'spender', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'allowance', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'needed', 'type': 'uint256' }
    ],
    'name': 'ERC20InsufficientAllowance',
    'type': 'error'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'sender', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'balance', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'needed', 'type': 'uint256' }
    ],
    'name': 'ERC20InsufficientBalance',
    'type': 'error'
  },
  { 'inputs': [{ 'internalType': 'address', 'name': 'approver', 'type': 'address' }], 'name': 'ERC20InvalidApprover', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'receiver', 'type': 'address' }], 'name': 'ERC20InvalidReceiver', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'sender', 'type': 'address' }], 'name': 'ERC20InvalidSender', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'spender', 'type': 'address' }], 'name': 'ERC20InvalidSpender', 'type': 'error' },
  { 'inputs': [], 'name': 'InvalidInitialization', 'type': 'error' },
  { 'inputs': [], 'name': 'NotInitializing', 'type': 'error' },
  { 'inputs': [], 'name': 'ReentrancyGuardReentrantCall', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'token', 'type': 'address' }], 'name': 'SafeERC20FailedOperation', 'type': 'error' },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'owner', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'spender', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'Approval',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'buyer', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'investmentAmount', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'feeAmount', 'type': 'uint256' },
      { 'indexed': true, 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'outcomeTokensBought', 'type': 'uint256' }
    ],
    'name': 'FPMMBuy',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'funder', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'amountsAdded', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'sharesMinted', 'type': 'uint256' }
    ],
    'name': 'FPMMFundingAdded',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'funder', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'amountsRemoved', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'collateralRemovedFromFeePool', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'sharesBurnt', 'type': 'uint256' }
    ],
    'name': 'FPMMFundingRemoved',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'seller', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'returnAmount', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'feeAmount', 'type': 'uint256' },
      { 'indexed': true, 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'outcomeTokensSold', 'type': 'uint256' }
    ],
    'name': 'FPMMSell',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint64', 'name': 'version', 'type': 'uint64' }],
    'name': 'Initialized',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'Transfer',
    'type': 'event'
  },
  {
    'inputs': [],
    'name': 'NAME',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'SYMBOL',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'addedFunds', 'type': 'uint256' },
      { 'internalType': 'uint256[]', 'name': 'distributionHint', 'type': 'uint256[]' }
    ],
    'name': 'addFunding',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'owner', 'type': 'address' },
      { 'internalType': 'address', 'name': 'spender', 'type': 'address' }
    ],
    'name': 'allowance',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'spender', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'approve',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
    'name': 'balanceOf',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'investmentAmount', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'minOutcomeTokensToBuy', 'type': 'uint256' }
    ],
    'name': 'buy',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'investmentAmount', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' }
    ],
    'name': 'calcBuyAmount',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'returnAmount', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' }
    ],
    'name': 'calcSellAmount',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'canTrade',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'collateralToken',
    'outputs': [{ 'internalType': 'contract IERC20', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': '', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': '', 'type': 'uint256' }
    ],
    'name': 'collectionIds',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'name': 'conditionIds',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'conditionalTokens',
    'outputs': [{ 'internalType': 'contract ConditionalTokens', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'creator',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'currentLiquidity',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'decimals',
    'outputs': [{ 'internalType': 'uint8', 'name': '', 'type': 'uint8' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'endTime',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'fee',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
    'name': 'feesWithdrawableBy',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  { 'inputs': [], 'name': 'finalizeSetup', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' },
  {
    'inputs': [],
    'name': 'fundingAmountTotal',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'fundingThreshold',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getFeePoolWeight',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract ConditionalTokens', 'name': '_conditionalTokens', 'type': 'address' },
      { 'internalType': 'contract IERC20', 'name': '_collateralToken', 'type': 'address' },
      { 'internalType': 'bytes32[]', 'name': 'conditions', 'type': 'bytes32[]' },
      { 'internalType': 'uint256', 'name': '_fee', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': '_treasuryPercent', 'type': 'uint256' },
      { 'internalType': 'address', 'name': '_treasury', 'type': 'address' },
      { 'internalType': 'uint256', 'name': '_fundingThreshold', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': '_endTime', 'type': 'uint256' },
      { 'internalType': 'address', 'name': '_creator', 'type': 'address' }
    ],
    'name': 'initializeBase',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'isFunded',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'isSetupComplete',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'isSetupStarted',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'name',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' },
      { 'internalType': 'uint256[]', 'name': 'values', 'type': 'uint256[]' },
      { 'internalType': 'bytes', 'name': 'data', 'type': 'bytes' }
    ],
    'name': 'onERC1155BatchReceived',
    'outputs': [{ 'internalType': 'bytes4', 'name': '', 'type': 'bytes4' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' },
      { 'internalType': 'bytes', 'name': 'data', 'type': 'bytes' }
    ],
    'name': 'onERC1155Received',
    'outputs': [{ 'internalType': 'bytes4', 'name': '', 'type': 'bytes4' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'name': 'outcomeSlotCounts',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'percentUL',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'name': 'positionIds',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': 'sharesToBurn', 'type': 'uint256' }],
    'name': 'removeFunding',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'returnAmount', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'outcomeIndex', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'maxOutcomeTokensToSell', 'type': 'uint256' }
    ],
    'name': 'sell',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'setupStepsProcessed',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': 'steps', 'type': 'uint256' }],
    'name': 'stepFinalizeSetup',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': 'interfaceId', 'type': 'bytes4' }],
    'name': 'supportsInterface',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'symbol',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalSupply',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'transfer',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'transferFrom',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'treasury',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'treasuryPercent',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }],
    'name': 'withdrawFees',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'name': 'withdrawnFees',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  }
];

/**
 * Fixed product market maker factory ABI.
 */
export const FPMM_FACTORY_ABI = [
  { 'inputs': [], 'stateMutability': 'nonpayable', 'type': 'constructor' },
  { 'inputs': [], 'name': 'CreateError', 'type': 'error' },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'creator', 'type': 'address' },
      { 'indexed': false, 'internalType': 'contract FixedProductMarketMaker', 'name': 'fixedProductMarketMaker', 'type': 'address' },
      { 'indexed': true, 'internalType': 'contract ConditionalTokens', 'name': 'conditionalTokens', 'type': 'address' },
      { 'indexed': true, 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'indexed': false, 'internalType': 'bytes32[]', 'name': 'conditions', 'type': 'bytes32[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'fee', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'treasuryPercent', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'address', 'name': 'treasury', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'fundingThreshold', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'endTime', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'buySellCapPercent', 'type': 'uint256' }
    ],
    'name': 'FixedProductMarketMakerCreation',
    'type': 'event'
  },
  {
    'inputs': [{ 'internalType': 'bytes', 'name': 'consData', 'type': 'bytes' }],
    'name': 'cloneConstructor',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract ConditionalTokens', 'name': 'conditionalTokens_', 'type': 'address' },
      { 'internalType': 'contract IERC20', 'name': 'collateralToken_', 'type': 'address' },
      { 'internalType': 'bytes32[]', 'name': 'conditions', 'type': 'bytes32[]' },
      { 'internalType': 'uint256', 'name': 'fee_', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'treasuryPercent_', 'type': 'uint256' },
      { 'internalType': 'address', 'name': 'treasury_', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'fundingThreshold_', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'endTime_', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'buySellCapPercent_', 'type': 'uint256' },
      { 'internalType': 'bytes32', 'name': 'salt', 'type': 'bytes32' }
    ],
    'name': 'createFixedProductMarketMaker',
    'outputs': [{ 'internalType': 'contract FixedProductMarketMaker', 'name': '', 'type': 'address' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'implementationMaster',
    'outputs': [{ 'internalType': 'contract FixedProductMarketMaker', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': 'salt', 'type': 'bytes32' }],
    'name': 'predictFixedProductMarketMakerAddress',
    'outputs': [{ 'internalType': 'address', 'name': 'predicted', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  }
];

/**
 * Conditionals token ABI.
 */
export const CONDITIONAL_TOKEN_ABI = [
  { 'inputs': [{ 'internalType': 'address', 'name': '_factory', 'type': 'address' }], 'stateMutability': 'nonpayable', 'type': 'constructor' },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'sender', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'balance', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'needed', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256' }
    ],
    'name': 'ERC1155InsufficientBalance',
    'type': 'error'
  },
  { 'inputs': [{ 'internalType': 'address', 'name': 'approver', 'type': 'address' }], 'name': 'ERC1155InvalidApprover', 'type': 'error' },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'idsLength', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'valuesLength', 'type': 'uint256' }
    ],
    'name': 'ERC1155InvalidArrayLength',
    'type': 'error'
  },
  { 'inputs': [{ 'internalType': 'address', 'name': 'operator', 'type': 'address' }], 'name': 'ERC1155InvalidOperator', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'receiver', 'type': 'address' }], 'name': 'ERC1155InvalidReceiver', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'sender', 'type': 'address' }], 'name': 'ERC1155InvalidSender', 'type': 'error' },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'internalType': 'address', 'name': 'owner', 'type': 'address' }
    ],
    'name': 'ERC1155MissingApprovalForAll',
    'type': 'error'
  },
  { 'inputs': [{ 'internalType': 'address', 'name': 'owner', 'type': 'address' }], 'name': 'OwnableInvalidOwner', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'address', 'name': 'account', 'type': 'address' }], 'name': 'OwnableUnauthorizedAccount', 'type': 'error' },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'indexed': false, 'internalType': 'bool', 'name': 'approved', 'type': 'bool' }
    ],
    'name': 'ApprovalForAll',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'address', 'name': 'oracle', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' }
    ],
    'name': 'ConditionPreparation',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'address', 'name': 'oracle', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'payoutNumerators', 'type': 'uint256[]' }
    ],
    'name': 'ConditionResolution',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'previousOwner', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }
    ],
    'name': 'OwnershipTransferred',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'redeemer', 'type': 'address' },
      { 'indexed': true, 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'indexSets', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'payout', 'type': 'uint256' }
    ],
    'name': 'PayoutRedemption',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'stakeholder', 'type': 'address' },
      { 'indexed': false, 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'partition', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'PositionSplit',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'stakeholder', 'type': 'address' },
      { 'indexed': false, 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'partition', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'PositionsMerge',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' },
      { 'indexed': false, 'internalType': 'uint256[]', 'name': 'values', 'type': 'uint256[]' }
    ],
    'name': 'TransferBatch',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'TransferSingle',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'string', 'name': 'value', 'type': 'string' },
      { 'indexed': true, 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' }
    ],
    'name': 'URI',
    'type': 'event'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' }
    ],
    'name': 'balanceOf',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address[]', 'name': 'accounts', 'type': 'address[]' },
      { 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' }
    ],
    'name': 'balanceOfBatch',
    'outputs': [{ 'internalType': 'uint256[]', 'name': '', 'type': 'uint256[]' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'factory',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'indexSet', 'type': 'uint256' }
    ],
    'name': 'getCollectionId',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'oracle', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' }
    ],
    'name': 'getConditionId',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' }],
    'name': 'getOutcomeSlotCount',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'collectionId', 'type': 'bytes32' }
    ],
    'name': 'getPositionId',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'internalType': 'address', 'name': 'operator', 'type': 'address' }
    ],
    'name': 'isApprovedForAll',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'name': 'marketMakers',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'internalType': 'uint256[]', 'name': 'partition', 'type': 'uint256[]' },
      { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'mergePositions',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'name': 'oracles',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'owner',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'name': 'payoutDenominator',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': '', 'type': 'uint256' }
    ],
    'name': 'payoutNumerators',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'oracle', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' }
    ],
    'name': 'prepareCondition',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'internalType': 'uint256[]', 'name': 'indexSets', 'type': 'uint256[]' }
    ],
    'name': 'redeemPositions',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  { 'inputs': [], 'name': 'renounceOwnership', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'internalType': 'uint256[]', 'name': 'payouts', 'type': 'uint256[]' }
    ],
    'name': 'reportPayouts',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'internalType': 'uint256[]', 'name': 'ids', 'type': 'uint256[]' },
      { 'internalType': 'uint256[]', 'name': 'values', 'type': 'uint256[]' },
      { 'internalType': 'bytes', 'name': 'data', 'type': 'bytes' }
    ],
    'name': 'safeBatchTransferFrom',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'from', 'type': 'address' },
      { 'internalType': 'address', 'name': 'to', 'type': 'address' },
      { 'internalType': 'uint256', 'name': 'id', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' },
      { 'internalType': 'bytes', 'name': 'data', 'type': 'bytes' }
    ],
    'name': 'safeTransferFrom',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'operator', 'type': 'address' },
      { 'internalType': 'bool', 'name': 'approved', 'type': 'bool' }
    ],
    'name': 'setApprovalForAll',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '_factory', 'type': 'address' }],
    'name': 'setFactory',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': '_marketMaker', 'type': 'address' },
      { 'internalType': 'bool', 'name': 'allowed', 'type': 'bool' }
    ],
    'name': 'setMarketMaker',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'oracle', 'type': 'address' },
      { 'internalType': 'bool', 'name': 'allowed', 'type': 'bool' }
    ],
    'name': 'setOracle',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IERC20', 'name': 'collateralToken', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'parentCollectionId', 'type': 'bytes32' },
      { 'internalType': 'bytes32', 'name': 'conditionId', 'type': 'bytes32' },
      { 'internalType': 'uint256[]', 'name': 'partition', 'type': 'uint256[]' },
      { 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'splitPosition',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': 'interfaceId', 'type': 'bytes4' }],
    'name': 'supportsInterface',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': 'newOwner', 'type': 'address' }],
    'name': 'transferOwnership',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'name': 'uri',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function'
  }
];

/**
 * Oracle ABI.
 */
export const ORACLE_ABI = [
  {
    'inputs': [
      { 'internalType': 'address', 'name': '_admin', 'type': 'address' },
      { 'internalType': 'address', 'name': '_conditionalTokens', 'type': 'address' },
      { 'internalType': 'uint256', 'name': '_minVotes', 'type': 'uint256' }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  { 'inputs': [], 'name': 'AccessControlBadConfirmation', 'type': 'error' },
  {
    'inputs': [
      { 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'internalType': 'bytes32', 'name': 'neededRole', 'type': 'bytes32' }
    ],
    'name': 'AccessControlUnauthorizedAccount',
    'type': 'error'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'previousAdminRole', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'newAdminRole', 'type': 'bytes32' }
    ],
    'name': 'RoleAdminChanged',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'sender', 'type': 'address' }
    ],
    'name': 'RoleGranted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'indexed': true, 'internalType': 'address', 'name': 'account', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'sender', 'type': 'address' }
    ],
    'name': 'RoleRevoked',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'voter', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'outcomeIdx', 'type': 'uint256' }
    ],
    'name': 'VoteSubmitted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'address', 'name': 'admin', 'type': 'address' },
      { 'indexed': true, 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' }
    ],
    'name': 'VotingForced',
    'type': 'event'
  },
  {
    'inputs': [],
    'name': 'DEFAULT_ADMIN_ROLE',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'VOTER_ROLE',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'conditionalTokens',
    'outputs': [{ 'internalType': 'contract IConditionalTokens', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      {
        'components': [
          { 'internalType': 'bytes32[]', 'name': 'merkleProof', 'type': 'bytes32[]' },
          {
            'components': [
              { 'internalType': 'bytes32', 'name': 'attestationType', 'type': 'bytes32' },
              { 'internalType': 'bytes32', 'name': 'sourceId', 'type': 'bytes32' },
              { 'internalType': 'uint64', 'name': 'votingRound', 'type': 'uint64' },
              { 'internalType': 'uint64', 'name': 'lowestUsedTimestamp', 'type': 'uint64' },
              {
                'components': [
                  { 'internalType': 'string', 'name': 'url', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'httpMethod', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'headers', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'queryParams', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'body', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'postProcessJq', 'type': 'string' },
                  { 'internalType': 'string', 'name': 'abiSignature', 'type': 'string' }
                ],
                'internalType': 'struct IWeb2Json.RequestBody',
                'name': 'requestBody',
                'type': 'tuple'
              },
              {
                'components': [{ 'internalType': 'bytes', 'name': 'abiEncodedData', 'type': 'bytes' }],
                'internalType': 'struct IWeb2Json.ResponseBody',
                'name': 'responseBody',
                'type': 'tuple'
              }
            ],
            'internalType': 'struct IWeb2Json.Response',
            'name': 'data',
            'type': 'tuple'
          }
        ],
        'internalType': 'struct IWeb2Json.Proof[]',
        'name': 'proofs',
        'type': 'tuple[]'
      },
      { 'internalType': 'bool', 'name': 'finalize', 'type': 'bool' }
    ],
    'name': 'finalizeQuestion',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' }],
    'name': 'forceVoting',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' }],
    'name': 'getRoleAdmin',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': 'account', 'type': 'address' }
    ],
    'name': 'grantRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': 'account', 'type': 'address' }
    ],
    'name': 'hasRole',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': '', 'type': 'address' }
    ],
    'name': 'hasVoted',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' },
      { 'internalType': 'string[]', 'name': 'urlAr', 'type': 'string[]' },
      { 'internalType': 'string[]', 'name': 'postprocessJqAr', 'type': 'string[]' },
      { 'internalType': 'uint256', 'name': 'consensusPercent', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'endTime', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'resolutionTime', 'type': 'uint256' },
      { 'internalType': 'bool', 'name': 'automatic', 'type': 'bool' }
    ],
    'name': 'initializeQuestion',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'name': 'jqProcessed',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'name': 'jqToQuestionId',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'minVotes',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'noOfVoters',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'name': 'question',
    'outputs': [
      { 'internalType': 'enum IgniteOracle.Status', 'name': 'status', 'type': 'uint8' },
      { 'internalType': 'bool', 'name': 'automatic', 'type': 'bool' },
      { 'internalType': 'uint256', 'name': 'outcomeSlotCount', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'apiSources', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'consensusPercent', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'endTime', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'resolutionTime', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'winnerIdx', 'type': 'uint256' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': '', 'type': 'uint256' }
    ],
    'name': 'questionOutcomeVotes',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': 'callerConfirmation', 'type': 'address' }
    ],
    'name': 'renounceRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'role', 'type': 'bytes32' },
      { 'internalType': 'address', 'name': 'account', 'type': 'address' }
    ],
    'name': 'revokeRole',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': 'interfaceId', 'type': 'bytes4' }],
    'name': 'supportsInterface',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32', 'name': 'questionId', 'type': 'bytes32' },
      { 'internalType': 'uint256', 'name': 'outcomeIdx', 'type': 'uint256' }
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
