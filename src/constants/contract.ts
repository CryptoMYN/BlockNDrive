export const BLOCKNDRIVE_CONTRACT_ADDRESS = "0xb52cb5804b7ca391b78b96941768517b45760580";
export const CRE_FORWARDER_ADDRESS = "0xF8344CFd5c43616a4366C34E3EEE75af79a74482";
export const HIGH_RISK_THRESHOLD = 80;

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CONFIG = {
  chainId: "0xaa36a7",
  chainName: "Sepolia Test Network",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "SEP",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

export const BLOCKNDRIVE_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_creForwarder",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [],
    name: "AlreadyDeleted",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "deleteDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "DocumentIsDeleted",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptyManifestCID",
    type: "error",
  },
  {
    inputs: [],
    name: "EmptyReport",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDocument",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidDocumentId",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidForwarder",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidRiskScore",
    type: "error",
  },
  {
    inputs: [],
    name: "NotAdmin",
    type: "error",
  },
  {
    inputs: [],
    name: "NotCREForwarder",
    type: "error",
  },
  {
    inputs: [],
    name: "NotDocumentOwner",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "manifestCID",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "manifestHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "riskScore",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "updatedAt",
        type: "uint64",
      },
    ],
    name: "AIAnalysisUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldForwarder",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newForwarder",
        type: "address",
      },
    ],
    name: "CREForwarderUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "DocumentDeleted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "manifestCID",
        type: "string",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "fileHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "manifestHash",
        type: "bytes32",
      },
    ],
    name: "DocumentUploaded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "riskScore",
        type: "uint8",
      },
    ],
    name: "HighRiskDocument",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "manifestCID",
        type: "string",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "manifestHash",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint64",
        name: "updatedAt",
        type: "uint64",
      },
    ],
    name: "ManifestUpdated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
      {
        internalType: "bytes",
        name: "report",
        type: "bytes",
      },
    ],
    name: "onReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newForwarder",
        type: "address",
      },
    ],
    name: "setCREForwarder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "newManifestCID",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "newManifestHash",
        type: "bytes32",
      },
    ],
    name: "updateManifest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "manifestCID",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "fileHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "manifestHash",
        type: "bytes32",
      },
      {
        internalType: "uint8",
        name: "initialRiskScore",
        type: "uint8",
      },
    ],
    name: "uploadDocument",
    outputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "admin",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "checkHighRisk",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "creForwarder",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "documentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getCREForwarder",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "getDocument",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "string",
            name: "manifestCID",
            type: "string",
          },
          {
            internalType: "bytes32",
            name: "fileHash",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "manifestHash",
            type: "bytes32",
          },
          {
            internalType: "uint64",
            name: "createdAt",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "updatedAt",
            type: "uint64",
          },
          {
            internalType: "uint8",
            name: "riskScore",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "deleted",
            type: "bool",
          },
        ],
        internalType: "struct BlockNDrive.Document",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "getDocumentHashes",
    outputs: [
      {
        internalType: "bytes32",
        name: "fileHash",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "manifestHash",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "getDocumentOwner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "getManifestCID",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyDocumentCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyDocuments",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "getRiskScore",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "HIGH_RISK_THRESHOLD",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "isDocumentActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "documentId",
        type: "uint256",
      },
    ],
    name: "isOwner",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;
