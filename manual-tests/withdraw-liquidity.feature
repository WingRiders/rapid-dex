Feature: Withdraw liquidity

  Scenario: Withdraw liquidity from tADA/tWRT pool
    Given User has connected wallet
    And User has at least 2 tADA in their wallet
    And User has created collateral in their wallet
    And There is a tADA/tWRT pool with 120 tADA, 991.915887 tWRT and 0.2% swap fee (created after the `add-liquidity.feature` test scenario)
      The PoolOutput entry in the database has the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA      | qtyB      | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 120000000 | 991915887 | 1             | 500      | null      |
    And User has 344,974,744 shares from the above-mentioned pool in their wallet (from creating the pool and adding liquidity)
    And User is on the pools page
    When User clicks the "Manage liquidity" button at the above-mentioned tADA/tWRT pool
    Then The app should show the "Manage liquidity in tADA / tWRT" modal
    When User clicks the "Withdraw liquidity" tab
    Then The app should show the UI for withdrawing liquidity
    When User clicks the "50%" button
    Then The input field for liquidity to withdraw is set to "50%"
    And The slider is set to 50%
    And User should see the withdrawn tADA as 59.999826 and withdrawn tWRT as 495.956505 (check the `frontend/test/app/withdraw-liquidity.spec.ts` file to verify that it is the correct value)
    And User should see the transaction fee
    And User should be able to click the "Withdraw liquidity" button
    When User clicks the "Withdraw liquidity" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    When User closes the "Transaction submitted" dialog
    And User navigates to the pools page
    And The transaction is confirmed on-chain
    Then The app should display the "Your transaction was confirmed on-chain" message
    And The tADA/tWRT pool is updated in the pools list within less than 2 seconds after the transaction is confirmed on-chain
    And There should be a new PoolOutput entry in the database with the following values:
      | assetAPolicy | assetAName | assetBPolicy                                             | assetBName           | qtyA     | qtyB      | swapFeePoints | feeBasis | spendSlot |
      |              |            | 659ab0b5658687c2e74cd10dba8244015b713bf503b90557769d77a7 | 57696e67526964657273 | 60000174 | 495959382 | 1             | 500      | null      |
