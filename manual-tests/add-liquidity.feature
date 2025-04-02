Feature: Add liquidity

  Scenario: Add liquidity to tADA/tWRT pool
    Given User has connected wallet
    And User has at least 12 tADA in their wallet
    And User has at least 83 tWRT in their wallet
    And User has created collateral in their wallet
    And There is a tADA/tWRT pool with 110 tADA, 909.256229 tWRT and 0.2% swap fee (created after the `swap.feature` test scenario)
      The PoolOutput entry in the database has the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB      | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 110000000 | 909256229 | 1             | 500      | null      |
    And User is on the pools page
    When User clicks the "Manage liquidity" button at the above-mentioned tADA/tWRT pool
    Then The app should show the "Manage liquidity in tADA / tWRT" modal
    And User sets the tADA quantity to 10
    Then The tWRT quantity is automatically calculated to 82.659658
    And User should see the earned shares as 28,747,978 (check the `frontend/test/app/add-liquidity.spec.ts` file to verify that it is the correct value)
    And User should see the transaction fee
    And User should be able to click the "Add liquidity" button
    When User clicks the "Add liquidity" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    When User closes the "Transaction submitted" dialog
    And User navigates to the pools page
    And The transaction is confirmed on-chain
    Then The app should display the "Your transaction was confirmed on-chain" message
    And The tADA/tWRT pool is updated in the pools list within less than 2 seconds after the transaction is confirmed on-chain
    And There should be a new PoolOutput entry in the database with the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB      | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 120000000 | 991915887 | 1             | 500      | null      |
