Feature: Create new pool

  Scenario: Create new tADA/tWRT pool
    Given User has connected wallet
    And User has at least 102 tADA in their wallet
    And User has at least 1,000 tWRT in their wallet
    And User has created collateral in their wallet
    And User is on the pool creation page
    When User selects tADA as the first asset
    And User selects tWRT as the second asset
    And User sets the tADA quantity to 100
    And User sets the tWRT quantity to 1,000
    And User sets the swap fee to 0.2%
    Then User should see calculated number of earned shares as "316,226,766" (check the `frontend/test/app/create-pool.spec.ts` file to verify that it is the correct value)
    And User should see the transaction fee
    And User should be able to click the "Create pool" button
    When User clicks the "Create pool" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    When User closes the "Transaction submitted" dialog
    And User navigates to the pools page
    And The transaction is confirmed on-chain
    Then The app should display the "Your transaction was confirmed on-chain" message
    And The new pool should be visible in the pools list within less than 2 seconds after the transaction is confirmed on-chain
    And There should be a new PoolOutput entry in the database with the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB       | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 100000000 | 1000000000 | 1             | 500      | null      |
