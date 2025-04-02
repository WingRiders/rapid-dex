Feature: Swap

  Scenario: Swap tADA -> tWRT
    Given User has connected wallet
    And User has at least 12 tADA in their wallet
    And User has created collateral in their wallet
    And There is a tADA/tWRT pool with 100 tADA, 1,000 tWRT and 0.2% swap fee (created from the `create-pool.feature` test scenario)
      The PoolOutput entry in the database has the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB       | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 100000000 | 1000000000 | 1             | 500      | null      |
    And User is on the swap page
    When User selects tADA as the first asset
    And User selects tWRT as the second asset
    And User selects the above-mentioned tADA/tWRT pool
    And User sets the tADA quantity to 10
    Then The tWRT quantity is automatically calculated to 90.743771 (check the `frontend/test/app/swap.spec.ts` file to verify that it is the correct value)
    And User should see the paid swap fee as 0.02 tADA
    And User should see the transaction fee
    And User should be able to click the "Swap" button
    When User clicks the "Swap" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    When User closes the "Transaction submitted" dialog
    And User navigates to the pools page
    And The transaction is confirmed on-chain
    Then The app should display the "Your transaction was confirmed on-chain" message
    And The tADA/tWRT pool is updated in the pools list within less than 2 seconds after the transaction is confirmed on-chain
    And There should be a new PoolOutput entry in the database with the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB      | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 110000000 | 909256229 | 1             | 500      | null      |
