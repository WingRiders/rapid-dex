Feature: Swap - chained transactions

  Scenario: Create 3 swap requests on the same pool in a row
    Given User has connected wallet
    And User has at least 20 tADA in their wallet
    And User has created collateral in their wallet
    And There is a tADA/tWRT pool created on the platform
    And User is on the swap page
    When User selects tADA as the first asset
    And User selects tWRT as the second asset
    And User selects any tADA/tWRT pool
    # First swap
    And User sets the tADA quantity to 5
    Then The tWRT quantity is automatically calculated
    And User should be able to click the "Swap" button
    When User clicks the "Swap" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    # Second swap
    When User closes the "Transaction submitted" dialog
    And User sets the tADA quantity to 5
    Then The tWRT quantity is automatically calculated
    And User should be able to click the "Swap" button
    When User clicks the "Swap" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog
    # Third swap
    When User closes the "Transaction submitted" dialog
    And User sets the tADA quantity to 5
    Then The tWRT quantity is automatically calculated
    And User should be able to click the "Swap" button
    When User clicks the "Swap" button
    And User confirms the transaction in their wallet
    Then The app should display the "Transaction submitted" dialog

    When User closes the "Transaction submitted" dialog
    And There is a new block added to the blockchain
    Then User should see the "Your transaction was confirmed on-chain" message three times
