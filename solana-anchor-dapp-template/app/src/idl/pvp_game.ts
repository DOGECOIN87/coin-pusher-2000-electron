/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pvp_game.json`.
 */
export type PvpGame = {
  "address": "979EWfY3g1JNLEsm9LLdZjQ3LRedtXGJ2Z4p6e1ma1AG",
  "metadata": {
    "name": "pvpGame",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Skill-based PVP game escrow program on Solana"
  },
  "instructions": [
    {
      "name": "cancelMatch",
      "docs": [
        "Cancel a match (only if no opponent has joined)",
        "Player 1 can cancel and get refund if no one joined"
      ],
      "discriminator": [
        142,
        136,
        247,
        45,
        92,
        112,
        180,
        83
      ],
      "accounts": [
        {
          "name": "gameMatch",
          "writable": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow vault holding Player 1's stake"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gameMatch"
              }
            ]
          }
        },
        {
          "name": "player1",
          "docs": [
            "Player 1 (match creator) cancelling the match"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claimWinnings",
      "docs": [
        "Claim winnings after match is settled",
        "Winner calls this to receive their prize"
      ],
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "gameMatch",
          "writable": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow vault holding the stakes"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gameMatch"
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Program-owned treasury vault to receive the platform fee"
          ],
          "writable": true
        },
        {
          "name": "winner",
          "docs": [
            "Winner claiming their prize"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createMatch",
      "docs": [
        "Create a new match and stake SOL",
        "Player 1 creates a match with a specific stake amount"
      ],
      "discriminator": [
        107,
        2,
        184,
        145,
        70,
        142,
        17,
        165
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "gameMatch",
          "docs": [
            "The match account (PDA derived from match_id)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  116,
                  99,
                  104
                ]
              },
              {
                "kind": "arg",
                "path": "matchId"
              }
            ]
          }
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow vault to hold the staked SOL (PDA, program-owned)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gameMatch"
              }
            ]
          }
        },
        {
          "name": "player1",
          "docs": [
            "Player 1 creating the match"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "stakeAmount",
          "type": "u64"
        },
        {
          "name": "matchId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "initializePlatform",
      "docs": [
        "Initialize the platform configuration",
        "Called once by the admin to set up the platform"
      ],
      "discriminator": [
        119,
        201,
        101,
        45,
        75,
        122,
        89,
        3
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "docs": [
            "Platform config account (PDA)"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "docs": [
            "Admin who initializes and controls the platform"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "gameAuthority",
          "docs": [
            "Game authority (server keypair) that will submit results"
          ]
        },
        {
          "name": "treasury",
          "docs": [
            "Program-owned treasury vault (PDA) where fees are accumulated."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "joinMatch",
      "docs": [
        "Join an existing match",
        "Player 2 joins by staking the same amount as Player 1"
      ],
      "discriminator": [
        244,
        8,
        47,
        130,
        192,
        59,
        179,
        44
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "gameMatch",
          "writable": true
        },
        {
          "name": "escrow",
          "docs": [
            "Escrow vault holding Player 1's stake"
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "gameMatch"
              }
            ]
          }
        },
        {
          "name": "player2",
          "docs": [
            "Player 2 joining the match"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "submitResult",
      "docs": [
        "Submit match result (game authority only)",
        "Called by the game server to declare the winner"
      ],
      "discriminator": [
        240,
        42,
        89,
        180,
        10,
        239,
        9,
        214
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "gameMatch",
          "writable": true
        },
        {
          "name": "gameAuthority",
          "docs": [
            "Game authority (server) that submits results"
          ],
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "winner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updatePlatform",
      "docs": [
        "Update platform settings (admin only)"
      ],
      "discriminator": [
        46,
        78,
        138,
        189,
        47,
        163,
        120,
        85
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "admin",
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        }
      ],
      "args": [
        {
          "name": "newAdmin",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "newGameAuthority",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "paused",
          "type": {
            "option": "bool"
          }
        }
      ]
    },
    {
      "name": "withdrawFees",
      "docs": [
        "Withdraw accumulated platform fees (admin only)"
      ],
      "discriminator": [
        198,
        212,
        171,
        109,
        144,
        215,
        174,
        89
      ],
      "accounts": [
        {
          "name": "platformConfig",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  108,
                  97,
                  116,
                  102,
                  111,
                  114,
                  109,
                  95,
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "treasury",
          "docs": [
            "Treasury account holding accumulated fees"
          ],
          "writable": true,
          "relations": [
            "platformConfig"
          ]
        },
        {
          "name": "destination",
          "docs": [
            "Destination for withdrawn fees"
          ],
          "writable": true
        },
        {
          "name": "admin",
          "docs": [
            "Admin withdrawing fees"
          ],
          "signer": true,
          "relations": [
            "platformConfig"
          ]
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "gameMatch",
      "discriminator": [
        87,
        187,
        102,
        98,
        236,
        52,
        127,
        39
      ]
    },
    {
      "name": "platformConfig",
      "discriminator": [
        160,
        78,
        128,
        0,
        248,
        83,
        230,
        160
      ]
    },
    {
      "name": "vault",
      "discriminator": [
        211,
        8,
        232,
        43,
        2,
        152,
        117,
        119
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "platformPaused",
      "msg": "Platform is currently paused"
    },
    {
      "code": 6001,
      "name": "unauthorizedAdmin",
      "msg": "Unauthorized: Only admin can perform this action"
    },
    {
      "code": 6002,
      "name": "unauthorizedGameAuthority",
      "msg": "Unauthorized: Only game authority can perform this action"
    },
    {
      "code": 6003,
      "name": "invalidMatchState",
      "msg": "Match is not in the correct state for this action"
    },
    {
      "code": 6004,
      "name": "invalidStakeAmount",
      "msg": "Stake amount must be greater than zero"
    },
    {
      "code": 6005,
      "name": "stakeTooLow",
      "msg": "Minimum stake is 0.01 SOL"
    },
    {
      "code": 6006,
      "name": "stakeTooHigh",
      "msg": "Maximum stake is 100 SOL"
    },
    {
      "code": 6007,
      "name": "invalidWinner",
      "msg": "Winner must be one of the players"
    },
    {
      "code": 6008,
      "name": "notWinner",
      "msg": "Only the winner can claim the prize"
    },
    {
      "code": 6009,
      "name": "matchFull",
      "msg": "Match already has two players"
    },
    {
      "code": 6010,
      "name": "cannotJoinOwnMatch",
      "msg": "Cannot join your own match"
    },
    {
      "code": 6011,
      "name": "cannotCancelActiveMatch",
      "msg": "Match can only be cancelled before an opponent joins"
    },
    {
      "code": 6012,
      "name": "onlyCreatorCanCancel",
      "msg": "Only the match creator can cancel"
    },
    {
      "code": 6013,
      "name": "insufficientEscrowFunds",
      "msg": "Insufficient funds in escrow"
    },
    {
      "code": 6014,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6015,
      "name": "matchExpired",
      "msg": "Match has expired"
    }
  ],
  "types": [
    {
      "name": "gameMatch",
      "docs": [
        "Individual match account",
        "Stores all data for a single PVP match"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "matchId",
            "docs": [
              "Unique match identifier"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "player1",
            "docs": [
              "Player 1 (match creator)"
            ],
            "type": "pubkey"
          },
          {
            "name": "player2",
            "docs": [
              "Player 2 (opponent) - Pubkey::default() if not joined"
            ],
            "type": "pubkey"
          },
          {
            "name": "stakeAmount",
            "docs": [
              "Stake amount per player in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "status",
            "docs": [
              "Current match status"
            ],
            "type": {
              "defined": {
                "name": "matchStatus"
              }
            }
          },
          {
            "name": "winner",
            "docs": [
              "Winner of the match (Pubkey::default() if not decided)"
            ],
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "docs": [
              "Timestamp when match was created"
            ],
            "type": "i64"
          },
          {
            "name": "startedAt",
            "docs": [
              "Timestamp when opponent joined"
            ],
            "type": "i64"
          },
          {
            "name": "endedAt",
            "docs": [
              "Timestamp when match ended"
            ],
            "type": "i64"
          },
          {
            "name": "feeAmount",
            "docs": [
              "Platform fee amount (calculated at settlement)"
            ],
            "type": "u64"
          },
          {
            "name": "prizeAmount",
            "docs": [
              "Prize amount for winner (total pot - fee)"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for match PDA"
            ],
            "type": "u8"
          },
          {
            "name": "escrowBump",
            "docs": [
              "Bump seed for escrow PDA"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "matchStatus",
      "docs": [
        "Match status enum"
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "waitingForOpponent"
          },
          {
            "name": "inProgress"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          },
          {
            "name": "claimed"
          }
        ]
      }
    },
    {
      "name": "platformConfig",
      "docs": [
        "Platform configuration account",
        "Stores global settings for the PVP game platform"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "Admin who can update platform settings and withdraw fees"
            ],
            "type": "pubkey"
          },
          {
            "name": "gameAuthority",
            "docs": [
              "Game authority (server) that can submit match results"
            ],
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "docs": [
              "Treasury account where fees are collected"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "docs": [
              "Platform fee in basis points (e.g., 500 = 5%)"
            ],
            "type": "u16"
          },
          {
            "name": "paused",
            "docs": [
              "Whether the platform is paused"
            ],
            "type": "bool"
          },
          {
            "name": "totalMatches",
            "docs": [
              "Total matches created"
            ],
            "type": "u64"
          },
          {
            "name": "matchesCompleted",
            "docs": [
              "Total matches completed"
            ],
            "type": "u64"
          },
          {
            "name": "totalVolume",
            "docs": [
              "Total volume in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "totalFeesCollected",
            "docs": [
              "Total fees collected in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "docs": [
              "Bump seed for PDA derivation"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "vault",
      "docs": [
        "Program-owned account that holds lamports.",
        "",
        "Used for:",
        "- Match escrow vaults (per match)",
        "- Platform fee treasury vault (global)"
      ],
      "type": {
        "kind": "struct",
        "fields": []
      }
    }
  ]
};
