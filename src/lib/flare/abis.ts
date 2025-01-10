/**
 * TODO: Where is official ABI library?
 * The provided script uses hardcoded ABI and address for the Coston testnet for simplicity, but anything more than a simple test should use get the address from ContractRegistry and the ABI from Flare' official abi library to ensure compatibility with the latest version of the contract.
 */

/**
 * Flare contract registry ABI.
 */
export const CONTRACT_REGISTRY_ABI = [
  {
    'inputs': [
      {
        'internalType': 'address',
        'name': '_addressUpdater',
        'type': 'address'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  {
    'inputs': [],
    'name': 'getAddressUpdater',
    'outputs': [
      {
        'internalType': 'address',
        'name': '_addressUpdater',
        'type': 'address'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getAllContracts',
    'outputs': [
      {
        'internalType': 'string[]',
        'name': '',
        'type': 'string[]'
      },
      {
        'internalType': 'address[]',
        'name': '',
        'type': 'address[]'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32',
        'name': '_nameHash',
        'type': 'bytes32'
      }
    ],
    'name': 'getContractAddressByHash',
    'outputs': [
      {
        'internalType': 'address',
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
        'internalType': 'string',
        'name': '_name',
        'type': 'string'
      }
    ],
    'name': 'getContractAddressByName',
    'outputs': [
      {
        'internalType': 'address',
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
        'internalType': 'bytes32[]',
        'name': '_nameHashes',
        'type': 'bytes32[]'
      }
    ],
    'name': 'getContractAddressesByHash',
    'outputs': [
      {
        'internalType': 'address[]',
        'name': '',
        'type': 'address[]'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'string[]',
        'name': '_names',
        'type': 'string[]'
      }
    ],
    'name': 'getContractAddressesByName',
    'outputs': [
      {
        'internalType': 'address[]',
        'name': '',
        'type': 'address[]'
      }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'internalType': 'bytes32[]',
        'name': '_contractNameHashes',
        'type': 'bytes32[]'
      },
      {
        'internalType': 'address[]',
        'name': '_contractAddresses',
        'type': 'address[]'
      }
    ],
    'name': 'updateContractAddresses',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];

/**
 * Flare Data Connector Hub ABI.
 */
export const FDC_HUB_ABI = [
  {
    'inputs': [
      { 'internalType': 'contract IGovernanceSettings', 'name': '_governanceSettings', 'type': 'address' },
      { 'internalType': 'address', 'name': '_initialGovernance', 'type': 'address' },
      { 'internalType': 'address', 'name': '_addressUpdater', 'type': 'address' },
      { 'internalType': 'uint8', 'name': '_requestsOffsetSeconds', 'type': 'uint8' }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes', 'name': 'data', 'type': 'bytes' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'fee', 'type': 'uint256' }
    ],
    'name': 'AttestationRequest',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint256', 'name': 'authorizedAmountWei', 'type': 'uint256' }],
    'name': 'DailyAuthorizedInflationSet',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'allowedAfterTimestamp', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'bytes', 'name': 'encodedCall', 'type': 'bytes' }
    ],
    'name': 'GovernanceCallTimelocked',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'initialGovernance', 'type': 'address' }],
    'name': 'GovernanceInitialised',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'governanceSettings', 'type': 'address' }],
    'name': 'GovernedProductionModeEntered',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint256', 'name': 'amountReceivedWei', 'type': 'uint256' }],
    'name': 'InflationReceived',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      {
        'components': [
          { 'internalType': 'bytes32', 'name': 'attestationType', 'type': 'bytes32' },
          { 'internalType': 'bytes32', 'name': 'source', 'type': 'bytes32' },
          { 'internalType': 'uint24', 'name': 'inflationShare', 'type': 'uint24' },
          { 'internalType': 'uint8', 'name': 'minRequestsThreshold', 'type': 'uint8' },
          { 'internalType': 'uint224', 'name': 'mode', 'type': 'uint224' }
        ],
        'indexed': false,
        'internalType': 'struct IFdcInflationConfigurations.FdcConfiguration[]',
        'name': 'fdcConfigurations',
        'type': 'tuple[]'
      },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'amount', 'type': 'uint256' }
    ],
    'name': 'InflationRewardsOffered',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint8', 'name': 'requestsOffsetSeconds', 'type': 'uint8' }],
    'name': 'RequestsOffsetSet',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'timestamp', 'type': 'uint256' }
    ],
    'name': 'TimelockedGovernanceCallCanceled',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'timestamp', 'type': 'uint256' }
    ],
    'name': 'TimelockedGovernanceCallExecuted',
    'type': 'event'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': '_selector', 'type': 'bytes4' }],
    'name': 'cancelGovernanceCall',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'dailyAuthorizedInflation',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': '_selector', 'type': 'bytes4' }],
    'name': 'executeGovernanceCall',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'fdcInflationConfigurations',
    'outputs': [{ 'internalType': 'contract IFdcInflationConfigurations', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'fdcRequestFeeConfigurations',
    'outputs': [{ 'internalType': 'contract IFdcRequestFeeConfigurations', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'flareSystemsManager',
    'outputs': [{ 'internalType': 'contract IIFlareSystemsManager', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getAddressUpdater',
    'outputs': [{ 'internalType': 'address', 'name': '_addressUpdater', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getContractName',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getExpectedBalance',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getInflationAddress',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getTokenPoolSupplyData',
    'outputs': [
      { 'internalType': 'uint256', 'name': '_lockedFundsWei', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': '_totalInflationAuthorizedWei', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': '_totalClaimedWei', 'type': 'uint256' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'governance',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'governanceSettings',
    'outputs': [{ 'internalType': 'contract IGovernanceSettings', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IGovernanceSettings', 'name': '_governanceSettings', 'type': 'address' },
      { 'internalType': 'address', 'name': '_initialGovernance', 'type': 'address' }
    ],
    'name': 'initialise',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '_address', 'type': 'address' }],
    'name': 'isExecutor',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'lastInflationAuthorizationReceivedTs',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'lastInflationReceivedTs',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'productionMode',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  { 'inputs': [], 'name': 'receiveInflation', 'outputs': [], 'stateMutability': 'payable', 'type': 'function' },
  {
    'inputs': [{ 'internalType': 'bytes', 'name': '_data', 'type': 'bytes' }],
    'name': 'requestAttestation',
    'outputs': [],
    'stateMutability': 'payable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'requestsOffsetSeconds',
    'outputs': [{ 'internalType': 'uint8', 'name': '', 'type': 'uint8' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'rewardManager',
    'outputs': [{ 'internalType': 'contract IIRewardManager', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_toAuthorizeWei', 'type': 'uint256' }],
    'name': 'setDailyAuthorizedInflation',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint8', 'name': '_requestsOffsetSeconds', 'type': 'uint8' }],
    'name': 'setRequestsOffset',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  { 'inputs': [], 'name': 'switchToProductionMode', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' }],
    'name': 'timelockedCalls',
    'outputs': [
      { 'internalType': 'uint256', 'name': 'allowedAfterTimestamp', 'type': 'uint256' },
      { 'internalType': 'bytes', 'name': 'encodedCall', 'type': 'bytes' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalInflationAuthorizedWei',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalInflationReceivedWei',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'totalInflationRewardsOfferedWei',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_currentRewardEpochId', 'type': 'uint24' },
      { 'internalType': 'uint64', 'name': '_currentRewardEpochExpectedEndTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardEpochDurationSeconds', 'type': 'uint64' }
    ],
    'name': 'triggerRewardEpochSwitchover',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32[]', 'name': '_contractNameHashes', 'type': 'bytes32[]' },
      { 'internalType': 'address[]', 'name': '_contractAddresses', 'type': 'address[]' }
    ],
    'name': 'updateContractAddresses',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  }
];

/**
 * Flare system manager ABI.
 */
export const SYSTEM_MANAGER_ABI = [
  {
    'inputs': [
      { 'internalType': 'contract IGovernanceSettings', 'name': '_governanceSettings', 'type': 'address' },
      { 'internalType': 'address', 'name': '_initialGovernance', 'type': 'address' },
      { 'internalType': 'address', 'name': '_addressUpdater', 'type': 'address' },
      { 'internalType': 'address', 'name': '_flareDaemon', 'type': 'address' },
      {
        'components': [
          { 'internalType': 'uint16', 'name': 'randomAcquisitionMaxDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'randomAcquisitionMaxDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'newSigningPolicyInitializationStartSeconds', 'type': 'uint16' },
          { 'internalType': 'uint8', 'name': 'newSigningPolicyMinNumberOfVotingRoundsDelay', 'type': 'uint8' },
          { 'internalType': 'uint16', 'name': 'voterRegistrationMinDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'voterRegistrationMinDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'submitUptimeVoteMinDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'submitUptimeVoteMinDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint24', 'name': 'signingPolicyThresholdPPM', 'type': 'uint24' },
          { 'internalType': 'uint16', 'name': 'signingPolicyMinNumberOfVoters', 'type': 'uint16' },
          { 'internalType': 'uint32', 'name': 'rewardExpiryOffsetSeconds', 'type': 'uint32' }
        ],
        'internalType': 'struct FlareSystemsManager.Settings',
        'name': '_settings',
        'type': 'tuple'
      },
      { 'internalType': 'uint32', 'name': '_firstVotingRoundStartTs', 'type': 'uint32' },
      { 'internalType': 'uint8', 'name': '_votingEpochDurationSeconds', 'type': 'uint8' },
      { 'internalType': 'uint32', 'name': '_firstRewardEpochStartVotingRoundId', 'type': 'uint32' },
      { 'internalType': 'uint16', 'name': '_rewardEpochDurationInVotingEpochs', 'type': 'uint16' },
      {
        'components': [
          { 'internalType': 'uint16', 'name': 'initialRandomVotePowerBlockSelectionSize', 'type': 'uint16' },
          { 'internalType': 'uint24', 'name': 'initialRewardEpochId', 'type': 'uint24' },
          { 'internalType': 'uint16', 'name': 'initialRewardEpochThreshold', 'type': 'uint16' }
        ],
        'internalType': 'struct FlareSystemsManager.InitialSettings',
        'name': '_initialSettings',
        'type': 'tuple'
      }
    ],
    'stateMutability': 'nonpayable',
    'type': 'constructor'
  },
  { 'inputs': [], 'name': 'ECDSAInvalidSignature', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'uint256', 'name': 'length', 'type': 'uint256' }], 'name': 'ECDSAInvalidSignatureLength', 'type': 'error' },
  { 'inputs': [{ 'internalType': 'bytes32', 'name': 's', 'type': 'bytes32' }], 'name': 'ECDSAInvalidSignatureS', 'type': 'error' },
  {
    'inputs': [
      { 'internalType': 'uint8', 'name': 'bits', 'type': 'uint8' },
      { 'internalType': 'uint256', 'name': 'value', 'type': 'uint256' }
    ],
    'name': 'SafeCastOverflowedUintDowncast',
    'type': 'error'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' }],
    'name': 'ClosingExpiredRewardEpochFailed',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'allowedAfterTimestamp', 'type': 'uint256' },
      { 'indexed': false, 'internalType': 'bytes', 'name': 'encodedCall', 'type': 'bytes' }
    ],
    'name': 'GovernanceCallTimelocked',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'initialGovernance', 'type': 'address' }],
    'name': 'GovernanceInitialised',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'address', 'name': 'governanceSettings', 'type': 'address' }],
    'name': 'GovernedProductionModeEntered',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' }
    ],
    'name': 'RandomAcquisitionStarted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': false, 'internalType': 'uint32', 'name': 'startVotingRoundId', 'type': 'uint32' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' }
    ],
    'name': 'RewardEpochStarted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': true, 'internalType': 'address', 'name': 'signingPolicyAddress', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'voter', 'type': 'address' },
      { 'indexed': false, 'internalType': 'bytes32', 'name': 'rewardsHash', 'type': 'bytes32' },
      {
        'components': [
          { 'internalType': 'uint256', 'name': 'rewardManagerId', 'type': 'uint256' },
          { 'internalType': 'uint256', 'name': 'noOfWeightBasedClaims', 'type': 'uint256' }
        ],
        'indexed': false,
        'internalType': 'struct IFlareSystemsManager.NumberOfWeightBasedClaims[]',
        'name': 'noOfWeightBasedClaims',
        'type': 'tuple[]'
      },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' },
      { 'indexed': false, 'internalType': 'bool', 'name': 'thresholdReached', 'type': 'bool' }
    ],
    'name': 'RewardsSigned',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint64', 'name': 'blockNumber', 'type': 'uint64' }],
    'name': 'SettingCleanUpBlockNumberFailed',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' }
    ],
    'name': 'SignUptimeVoteEnabled',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': true, 'internalType': 'address', 'name': 'signingPolicyAddress', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'voter', 'type': 'address' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' },
      { 'indexed': false, 'internalType': 'bool', 'name': 'thresholdReached', 'type': 'bool' }
    ],
    'name': 'SigningPolicySigned',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'timestamp', 'type': 'uint256' }
    ],
    'name': 'TimelockedGovernanceCallCanceled',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': false, 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' },
      { 'indexed': false, 'internalType': 'uint256', 'name': 'timestamp', 'type': 'uint256' }
    ],
    'name': 'TimelockedGovernanceCallExecuted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [{ 'indexed': false, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' }],
    'name': 'TriggeringVoterRegistrationFailed',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': true, 'internalType': 'address', 'name': 'signingPolicyAddress', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'voter', 'type': 'address' },
      { 'indexed': false, 'internalType': 'bytes32', 'name': 'uptimeVoteHash', 'type': 'bytes32' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' },
      { 'indexed': false, 'internalType': 'bool', 'name': 'thresholdReached', 'type': 'bool' }
    ],
    'name': 'UptimeVoteSigned',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': true, 'internalType': 'address', 'name': 'signingPolicyAddress', 'type': 'address' },
      { 'indexed': true, 'internalType': 'address', 'name': 'voter', 'type': 'address' },
      { 'indexed': false, 'internalType': 'bytes20[]', 'name': 'nodeIds', 'type': 'bytes20[]' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' }
    ],
    'name': 'UptimeVoteSubmitted',
    'type': 'event'
  },
  {
    'anonymous': false,
    'inputs': [
      { 'indexed': true, 'internalType': 'uint24', 'name': 'rewardEpochId', 'type': 'uint24' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'votePowerBlock', 'type': 'uint64' },
      { 'indexed': false, 'internalType': 'uint64', 'name': 'timestamp', 'type': 'uint64' }
    ],
    'name': 'VotePowerBlockSelected',
    'type': 'event'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': '_selector', 'type': 'bytes4' }],
    'name': 'cancelGovernanceCall',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'cleanupBlockNumberManager',
    'outputs': [{ 'internalType': 'contract IICleanupBlockNumberManager', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'currentRewardEpochExpectedEndTs',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'daemonize',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': '_selector', 'type': 'bytes4' }],
    'name': 'executeGovernanceCall',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'firstRewardEpochStartTs',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'firstVotingRoundStartTs',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'flareDaemon',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getAddressUpdater',
    'outputs': [{ 'internalType': 'address', 'name': '_addressUpdater', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getContractName',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'pure',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getCurrentRewardEpoch',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getCurrentRewardEpochId',
    'outputs': [{ 'internalType': 'uint24', 'name': '', 'type': 'uint24' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getCurrentVotingEpochId',
    'outputs': [{ 'internalType': 'uint32', 'name': '', 'type': 'uint32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' }],
    'name': 'getRandomAcquisitionInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_randomAcquisitionStartTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_randomAcquisitionStartBlock', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_randomAcquisitionEndTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_randomAcquisitionEndBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' }],
    'name': 'getRewardEpochStartInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_rewardEpochStartTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardEpochStartBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'getRewardEpochSwitchoverTriggerContracts',
    'outputs': [{ 'internalType': 'contract IIRewardEpochSwitchoverTrigger[]', 'name': '', 'type': 'address[]' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' }],
    'name': 'getRewardsSignInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_rewardsSignStartTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardsSignStartBlock', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardsSignEndTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardsSignEndBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_rewardEpochId', 'type': 'uint256' }],
    'name': 'getSeed',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' }],
    'name': 'getSigningPolicySignInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_signingPolicySignStartTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_signingPolicySignStartBlock', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_signingPolicySignEndTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_signingPolicySignEndBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_rewardEpochId', 'type': 'uint256' }],
    'name': 'getStartVotingRoundId',
    'outputs': [{ 'internalType': 'uint32', 'name': '', 'type': 'uint32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_rewardEpochId', 'type': 'uint256' }],
    'name': 'getThreshold',
    'outputs': [{ 'internalType': 'uint16', 'name': '', 'type': 'uint16' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' }],
    'name': 'getUptimeVoteSignStartInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_uptimeVoteSignStartTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_uptimeVoteSignStartBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_rewardEpochId', 'type': 'uint256' }],
    'name': 'getVotePowerBlock',
    'outputs': [{ 'internalType': 'uint64', 'name': '_votePowerBlock', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': '_rewardEpochId', 'type': 'uint256' }],
    'name': 'getVoterRegistrationData',
    'outputs': [
      { 'internalType': 'uint256', 'name': '_votePowerBlock', 'type': 'uint256' },
      { 'internalType': 'bool', 'name': '_enabled', 'type': 'bool' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'address', 'name': '_voter', 'type': 'address' }
    ],
    'name': 'getVoterRewardsSignInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_rewardsSignTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_rewardsSignBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'address', 'name': '_voter', 'type': 'address' }
    ],
    'name': 'getVoterSigningPolicySignInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_signingPolicySignTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_signingPolicySignBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'address', 'name': '_voter', 'type': 'address' }
    ],
    'name': 'getVoterUptimeVoteSignInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_uptimeVoteSignTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_uptimeVoteSignBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'address', 'name': '_voter', 'type': 'address' }
    ],
    'name': 'getVoterUptimeVoteSubmitInfo',
    'outputs': [
      { 'internalType': 'uint64', 'name': '_uptimeVoteSubmitTs', 'type': 'uint64' },
      { 'internalType': 'uint64', 'name': '_uptimeVoteSubmitBlock', 'type': 'uint64' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'governance',
    'outputs': [{ 'internalType': 'address', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'governanceSettings',
    'outputs': [{ 'internalType': 'contract IGovernanceSettings', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'initialRandomVotePowerBlockSelectionSize',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'contract IGovernanceSettings', 'name': '_governanceSettings', 'type': 'address' },
      { 'internalType': 'address', 'name': '_initialGovernance', 'type': 'address' }
    ],
    'name': 'initialise',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'address', 'name': '_address', 'type': 'address' }],
    'name': 'isExecutor',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'isVoterRegistrationEnabled',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'lastInitializedVotingRoundId',
    'outputs': [{ 'internalType': 'uint32', 'name': '', 'type': 'uint32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'newSigningPolicyInitializationStartSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'newSigningPolicyMinNumberOfVotingRoundsDelay',
    'outputs': [{ 'internalType': 'uint32', 'name': '', 'type': 'uint32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint256', 'name': 'rewardEpochId', 'type': 'uint256' },
      { 'internalType': 'uint256', 'name': 'rewardManagerId', 'type': 'uint256' }
    ],
    'name': 'noOfWeightBasedClaims',
    'outputs': [{ 'internalType': 'uint256', 'name': '', 'type': 'uint256' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': 'rewardEpochId', 'type': 'uint256' }],
    'name': 'noOfWeightBasedClaimsHash',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'productionMode',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'randomAcquisitionMaxDurationBlocks',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'randomAcquisitionMaxDurationSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'relay',
    'outputs': [{ 'internalType': 'contract IIRelay', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'rewardEpochDurationSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'rewardEpochIdToExpireNext',
    'outputs': [{ 'internalType': 'uint24', 'name': '', 'type': 'uint24' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'rewardExpiryOffsetSeconds',
    'outputs': [{ 'internalType': 'uint32', 'name': '', 'type': 'uint32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'rewardManager',
    'outputs': [{ 'internalType': 'contract IIRewardManager', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': 'rewardEpochId', 'type': 'uint256' }],
    'name': 'rewardsHash',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'contract IIRewardEpochSwitchoverTrigger[]', 'name': '_contracts', 'type': 'address[]' }],
    'name': 'setRewardEpochSwitchoverTriggerContracts',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      {
        'components': [
          { 'internalType': 'uint256', 'name': 'rewardManagerId', 'type': 'uint256' },
          { 'internalType': 'uint256', 'name': 'noOfWeightBasedClaims', 'type': 'uint256' }
        ],
        'internalType': 'struct IFlareSystemsManager.NumberOfWeightBasedClaims[]',
        'name': '_noOfWeightBasedClaims',
        'type': 'tuple[]'
      },
      { 'internalType': 'bytes32', 'name': '_rewardsHash', 'type': 'bytes32' }
    ],
    'name': 'setRewardsData',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bool', 'name': '_submit3Aligned', 'type': 'bool' }],
    'name': 'setSubmit3Aligned',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'bool', 'name': '_triggerExpirationAndCleanup', 'type': 'bool' }],
    'name': 'setTriggerExpirationAndCleanup',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'contract IIVoterRegistrationTrigger', 'name': '_contract', 'type': 'address' }],
    'name': 'setVoterRegistrationTriggerContract',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'bytes32', 'name': '_newSigningPolicyHash', 'type': 'bytes32' },
      {
        'components': [
          { 'internalType': 'uint8', 'name': 'v', 'type': 'uint8' },
          { 'internalType': 'bytes32', 'name': 'r', 'type': 'bytes32' },
          { 'internalType': 'bytes32', 'name': 's', 'type': 'bytes32' }
        ],
        'internalType': 'struct IFlareSystemsManager.Signature',
        'name': '_signature',
        'type': 'tuple'
      }
    ],
    'name': 'signNewSigningPolicy',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      {
        'components': [
          { 'internalType': 'uint256', 'name': 'rewardManagerId', 'type': 'uint256' },
          { 'internalType': 'uint256', 'name': 'noOfWeightBasedClaims', 'type': 'uint256' }
        ],
        'internalType': 'struct IFlareSystemsManager.NumberOfWeightBasedClaims[]',
        'name': '_noOfWeightBasedClaims',
        'type': 'tuple[]'
      },
      { 'internalType': 'bytes32', 'name': '_rewardsHash', 'type': 'bytes32' },
      {
        'components': [
          { 'internalType': 'uint8', 'name': 'v', 'type': 'uint8' },
          { 'internalType': 'bytes32', 'name': 'r', 'type': 'bytes32' },
          { 'internalType': 'bytes32', 'name': 's', 'type': 'bytes32' }
        ],
        'internalType': 'struct IFlareSystemsManager.Signature',
        'name': '_signature',
        'type': 'tuple'
      }
    ],
    'name': 'signRewards',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'bytes32', 'name': '_uptimeVoteHash', 'type': 'bytes32' },
      {
        'components': [
          { 'internalType': 'uint8', 'name': 'v', 'type': 'uint8' },
          { 'internalType': 'bytes32', 'name': 'r', 'type': 'bytes32' },
          { 'internalType': 'bytes32', 'name': 's', 'type': 'bytes32' }
        ],
        'internalType': 'struct IFlareSystemsManager.Signature',
        'name': '_signature',
        'type': 'tuple'
      }
    ],
    'name': 'signUptimeVote',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'signingPolicyMinNumberOfVoters',
    'outputs': [{ 'internalType': 'uint16', 'name': '', 'type': 'uint16' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'signingPolicyThresholdPPM',
    'outputs': [{ 'internalType': 'uint24', 'name': '', 'type': 'uint24' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'submission',
    'outputs': [{ 'internalType': 'contract IISubmission', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'submit3Aligned',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'uint24', 'name': '_rewardEpochId', 'type': 'uint24' },
      { 'internalType': 'bytes20[]', 'name': '_nodeIds', 'type': 'bytes20[]' },
      {
        'components': [
          { 'internalType': 'uint8', 'name': 'v', 'type': 'uint8' },
          { 'internalType': 'bytes32', 'name': 'r', 'type': 'bytes32' },
          { 'internalType': 'bytes32', 'name': 's', 'type': 'bytes32' }
        ],
        'internalType': 'struct IFlareSystemsManager.Signature',
        'name': '_signature',
        'type': 'tuple'
      }
    ],
    'name': 'submitUptimeVote',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'submitUptimeVoteMinDurationBlocks',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'submitUptimeVoteMinDurationSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'switchToFallbackMode',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  { 'inputs': [], 'name': 'switchToProductionMode', 'outputs': [], 'stateMutability': 'nonpayable', 'type': 'function' },
  {
    'inputs': [{ 'internalType': 'bytes4', 'name': 'selector', 'type': 'bytes4' }],
    'name': 'timelockedCalls',
    'outputs': [
      { 'internalType': 'uint256', 'name': 'allowedAfterTimestamp', 'type': 'uint256' },
      { 'internalType': 'bytes', 'name': 'encodedCall', 'type': 'bytes' }
    ],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'triggerExpirationAndCleanup',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [
      { 'internalType': 'bytes32[]', 'name': '_contractNameHashes', 'type': 'bytes32[]' },
      { 'internalType': 'address[]', 'name': '_contractAddresses', 'type': 'address[]' }
    ],
    'name': 'updateContractAddresses',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [
      {
        'components': [
          { 'internalType': 'uint16', 'name': 'randomAcquisitionMaxDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'randomAcquisitionMaxDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'newSigningPolicyInitializationStartSeconds', 'type': 'uint16' },
          { 'internalType': 'uint8', 'name': 'newSigningPolicyMinNumberOfVotingRoundsDelay', 'type': 'uint8' },
          { 'internalType': 'uint16', 'name': 'voterRegistrationMinDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'voterRegistrationMinDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'submitUptimeVoteMinDurationSeconds', 'type': 'uint16' },
          { 'internalType': 'uint16', 'name': 'submitUptimeVoteMinDurationBlocks', 'type': 'uint16' },
          { 'internalType': 'uint24', 'name': 'signingPolicyThresholdPPM', 'type': 'uint24' },
          { 'internalType': 'uint16', 'name': 'signingPolicyMinNumberOfVoters', 'type': 'uint16' },
          { 'internalType': 'uint32', 'name': 'rewardExpiryOffsetSeconds', 'type': 'uint32' }
        ],
        'internalType': 'struct FlareSystemsManager.Settings',
        'name': '_settings',
        'type': 'tuple'
      }
    ],
    'name': 'updateSettings',
    'outputs': [],
    'stateMutability': 'nonpayable',
    'type': 'function'
  },
  {
    'inputs': [{ 'internalType': 'uint256', 'name': 'rewardEpochId', 'type': 'uint256' }],
    'name': 'uptimeVoteHash',
    'outputs': [{ 'internalType': 'bytes32', 'name': '', 'type': 'bytes32' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'voterRegistrationMinDurationBlocks',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'voterRegistrationMinDurationSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'voterRegistrationTriggerContract',
    'outputs': [{ 'internalType': 'contract IIVoterRegistrationTrigger', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'voterRegistry',
    'outputs': [{ 'internalType': 'contract IIVoterRegistry', 'name': '', 'type': 'address' }],
    'stateMutability': 'view',
    'type': 'function'
  },
  {
    'inputs': [],
    'name': 'votingEpochDurationSeconds',
    'outputs': [{ 'internalType': 'uint64', 'name': '', 'type': 'uint64' }],
    'stateMutability': 'view',
    'type': 'function'
  }
];
