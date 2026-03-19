// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../src/SpendPolicy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract SpendPolicyTest is Test {
    SpendPolicy public policy;
    MockUSDC public usdc;

    address public protocolOwner;
    address public human;
    address public agent;
    address public merchant;
    address public stranger;

    uint256 constant PER_TX  = 1e6;    // 1 USDC
    uint256 constant DAILY   = 5e6;    // 5 USDC
    bytes32 constant INTENT  = keccak256("buy something");

    function setUp() public {
        protocolOwner = makeAddr("protocolOwner");
        human         = makeAddr("human");
        agent         = makeAddr("agent");
        merchant      = makeAddr("merchant");
        stranger      = makeAddr("stranger");

        usdc = new MockUSDC();

        vm.prank(protocolOwner);
        policy = new SpendPolicy(address(usdc));
    }

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────

    function _registerAgent(bool allowlistEnabled) internal {
        vm.prank(human);
        policy.registerAgent(agent, PER_TX, DAILY, allowlistEnabled);
    }

    function _fundAndApprove(address from, uint256 amount) internal {
        usdc.mint(from, amount);
        vm.prank(from);
        usdc.approve(address(policy), amount);
    }

    // ─────────────────────────────────────────────────────────
    // Registration tests
    // ─────────────────────────────────────────────────────────

    function test_registerAgent_success() public {
        vm.expectEmit(true, true, false, true);
        emit SpendPolicy.AgentRegistered(agent, human, PER_TX, DAILY);

        _registerAgent(false);

        SpendPolicy.Policy memory p = policy.getPolicy(agent);
        assertEq(p.perTxLimit, PER_TX);
        assertEq(p.dailyLimit, DAILY);
        assertEq(p.dailySpent, 0);
        assertEq(p.humanOwner, human);
        assertEq(uint8(p.status), uint8(SpendPolicy.AgentStatus.Active));
        assertEq(p.merchantAllowlistEnabled, false);
    }

    function test_registerAgent_revertsIfAlreadyRegistered() public {
        _registerAgent(false);
        vm.prank(human);
        vm.expectRevert(SpendPolicy.AgentAlreadyRegistered.selector);
        policy.registerAgent(agent, PER_TX, DAILY, false);
    }

    function test_registerAgent_revertsIfRevoked() public {
        _registerAgent(false);
        vm.prank(human);
        policy.revokeAgent(agent);

        // humanOwner is still set after revocation, so AgentAlreadyRegistered fires first
        vm.prank(human);
        vm.expectRevert(SpendPolicy.AgentAlreadyRegistered.selector);
        policy.registerAgent(agent, PER_TX, DAILY, false);
    }

    function test_registerAgent_revertsIfZeroAddress() public {
        vm.prank(human);
        vm.expectRevert(SpendPolicy.ZeroAddress.selector);
        policy.registerAgent(address(0), PER_TX, DAILY, false);
    }

    function test_registerAgent_revertsIfPerTxExceedsDailyLimit() public {
        vm.prank(human);
        vm.expectRevert(SpendPolicy.InvalidLimits.selector);
        policy.registerAgent(agent, DAILY + 1, DAILY, false);
    }

    function test_registerAgent_revertsIfZeroLimits() public {
        vm.prank(human);
        vm.expectRevert(SpendPolicy.InvalidLimits.selector);
        policy.registerAgent(agent, 0, DAILY, false);

        vm.prank(human);
        vm.expectRevert(SpendPolicy.InvalidLimits.selector);
        policy.registerAgent(agent, PER_TX, 0, false);
    }

    // ─────────────────────────────────────────────────────────
    // Lifecycle tests
    // ─────────────────────────────────────────────────────────

    function test_deactivateAgent_success() public {
        _registerAgent(false);

        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.AgentDeactivated(agent, human);

        vm.prank(human);
        policy.deactivateAgent(agent);

        assertEq(uint8(policy.agentStatus(agent)), uint8(SpendPolicy.AgentStatus.Deactivated));
    }

    function test_deactivateAgent_revertsIfNotHumanOwner() public {
        _registerAgent(false);
        vm.prank(stranger);
        vm.expectRevert(SpendPolicy.NotHumanOwner.selector);
        policy.deactivateAgent(agent);
    }

    function test_reactivateAgent_success() public {
        _registerAgent(false);
        vm.prank(human);
        policy.deactivateAgent(agent);

        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.AgentReactivated(agent, human);

        vm.prank(human);
        policy.reactivateAgent(agent);

        assertEq(uint8(policy.agentStatus(agent)), uint8(SpendPolicy.AgentStatus.Active));
    }

    function test_revokeAgent_success() public {
        _registerAgent(false);

        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.AgentRevoked(agent, human);

        vm.prank(human);
        policy.revokeAgent(agent);

        assertEq(uint8(policy.agentStatus(agent)), uint8(SpendPolicy.AgentStatus.Revoked));
    }

    function test_revokeAgent_isPermanent() public {
        _registerAgent(false);
        vm.prank(human);
        policy.revokeAgent(agent);

        vm.prank(human);
        vm.expectRevert(SpendPolicy.AgentAlreadyRevoked.selector);
        policy.reactivateAgent(agent);
    }

    function test_deactivate_revertsIfRevoked() public {
        _registerAgent(false);
        vm.prank(human);
        policy.revokeAgent(agent);

        vm.prank(human);
        vm.expectRevert(SpendPolicy.AgentAlreadyRevoked.selector);
        policy.deactivateAgent(agent);
    }

    // ─────────────────────────────────────────────────────────
    // Policy management tests
    // ─────────────────────────────────────────────────────────

    function test_updatePolicy_success() public {
        _registerAgent(false);
        uint256 newPerTx = 2e6;
        uint256 newDaily = 10e6;

        vm.expectEmit(true, false, false, true);
        emit SpendPolicy.PolicyUpdated(agent, newPerTx, newDaily);

        vm.prank(human);
        policy.updatePolicy(agent, newPerTx, newDaily);

        SpendPolicy.Policy memory p = policy.getPolicy(agent);
        assertEq(p.perTxLimit, newPerTx);
        assertEq(p.dailyLimit, newDaily);
    }

    function test_updatePolicy_revertsIfNotHumanOwner() public {
        _registerAgent(false);
        vm.prank(stranger);
        vm.expectRevert(SpendPolicy.NotHumanOwner.selector);
        policy.updatePolicy(agent, PER_TX, DAILY);
    }

    function test_toggleMerchantAllowlist_success() public {
        _registerAgent(false);

        vm.expectEmit(true, false, false, true);
        emit SpendPolicy.AllowlistToggled(agent, true);

        vm.prank(human);
        policy.toggleMerchantAllowlist(agent, true);
        assertEq(policy.getPolicy(agent).merchantAllowlistEnabled, true);
    }

    function test_allowMerchant_success() public {
        _registerAgent(true);

        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.MerchantAllowlisted(agent, merchant);

        vm.prank(human);
        policy.allowMerchant(agent, merchant);
        assertTrue(policy.isMerchantAllowed(agent, merchant));
    }

    function test_removeMerchant_success() public {
        _registerAgent(true);
        vm.prank(human);
        policy.allowMerchant(agent, merchant);

        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.MerchantRemoved(agent, merchant);

        vm.prank(human);
        policy.removeMerchant(agent, merchant);
        assertFalse(policy.isMerchantAllowed(agent, merchant));
    }

    // ─────────────────────────────────────────────────────────
    // executePayment — happy paths
    // ─────────────────────────────────────────────────────────

    function test_executePayment_success_noAllowlist() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX);

        uint256 merchantBefore = usdc.balanceOf(merchant);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        assertEq(usdc.balanceOf(merchant), merchantBefore + PER_TX);
        assertEq(policy.getPolicy(agent).dailySpent, PER_TX);
    }

    function test_executePayment_success_withAllowlist() public {
        _registerAgent(true);
        vm.prank(human);
        policy.allowMerchant(agent, merchant);
        _fundAndApprove(agent, PER_TX);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        assertEq(policy.getPolicy(agent).dailySpent, PER_TX);
    }

    function test_executePayment_resetsWindowAfter24h() public {
        _registerAgent(false);
        _fundAndApprove(agent, DAILY + PER_TX);

        // Spend full daily budget
        vm.prank(agent);
        usdc.approve(address(policy), DAILY);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        // Warp 25 hours
        vm.warp(block.timestamp + 25 hours);

        usdc.mint(agent, PER_TX);
        vm.prank(agent);
        usdc.approve(address(policy), PER_TX);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        assertEq(policy.getPolicy(agent).dailySpent, PER_TX);
    }

    function test_executePayment_accumulatesDailySpend() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX * 3);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        assertEq(policy.getPolicy(agent).dailySpent, PER_TX);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        assertEq(policy.getPolicy(agent).dailySpent, PER_TX * 2);

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        assertEq(policy.getPolicy(agent).dailySpent, PER_TX * 3);
    }

    function test_executePayment_emitsCorrectEvent() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX);

        vm.expectEmit(true, true, true, true);
        emit SpendPolicy.PaymentExecuted(
            agent,
            merchant,
            PER_TX,
            INTENT,
            PER_TX,
            block.timestamp
        );

        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    // ─────────────────────────────────────────────────────────
    // executePayment — revert paths
    // ─────────────────────────────────────────────────────────

    function test_executePayment_revertsIfAgentNotActive() public {
        _registerAgent(false);
        vm.prank(human);
        policy.deactivateAgent(agent);

        _fundAndApprove(agent, PER_TX);
        vm.prank(agent);
        vm.expectRevert(SpendPolicy.AgentNotActive.selector);
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    function test_executePayment_revertsIfAgentRevoked() public {
        _registerAgent(false);
        vm.prank(human);
        policy.revokeAgent(agent);

        _fundAndApprove(agent, PER_TX);
        vm.prank(agent);
        vm.expectRevert(SpendPolicy.AgentNotActive.selector);
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    function test_executePayment_revertsIfMerchantNotAllowed() public {
        _registerAgent(true);
        _fundAndApprove(agent, PER_TX);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendPolicy.MerchantNotAllowed.selector, merchant));
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    function test_executePayment_revertsIfExceedsPerTxLimit() public {
        _registerAgent(false);
        uint256 over = PER_TX + 1;
        _fundAndApprove(agent, over);

        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(SpendPolicy.ExceedsPerTxLimit.selector, over, PER_TX));
        policy.executePayment(merchant, over, INTENT);
    }

    function test_executePayment_revertsIfExceedsDailyLimit() public {
        // Register agent2 with perTx = DAILY so a single tx can fill the budget,
        // then a second small tx hits the daily limit (not the per-tx limit).
        address agent2 = makeAddr("agent2");
        vm.prank(human);
        policy.registerAgent(agent2, DAILY, DAILY, false);

        // First payment fills the daily budget exactly
        usdc.mint(agent2, DAILY + PER_TX);
        vm.prank(agent2);
        usdc.approve(address(policy), DAILY + PER_TX);
        vm.prank(agent2);
        policy.executePayment(merchant, DAILY, INTENT);

        // Second payment: amount (PER_TX) <= perTxLimit but remaining = 0
        vm.prank(agent2);
        vm.expectRevert(abi.encodeWithSelector(SpendPolicy.ExceedsDailyLimit.selector, PER_TX, 0));
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    function test_executePayment_revertsIfPaused() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX);

        vm.prank(protocolOwner);
        policy.pause();

        vm.prank(agent);
        vm.expectRevert();
        policy.executePayment(merchant, PER_TX, INTENT);
    }

    function test_executePayment_revertsIfZeroAmount() public {
        _registerAgent(false);
        vm.prank(agent);
        vm.expectRevert(SpendPolicy.ZeroAmount.selector);
        policy.executePayment(merchant, 0, INTENT);
    }

    function test_executePayment_revertsIfZeroMerchant() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX);
        vm.prank(agent);
        vm.expectRevert(SpendPolicy.ZeroAddress.selector);
        policy.executePayment(address(0), PER_TX, INTENT);
    }

    // ─────────────────────────────────────────────────────────
    // checkPayment view tests
    // ─────────────────────────────────────────────────────────

    function test_checkPayment_returnsTrue_validPayment() public {
        _registerAgent(false);
        (bool allowed, string memory reason) = policy.checkPayment(agent, merchant, PER_TX);
        assertTrue(allowed);
        assertEq(reason, "");
    }

    function test_checkPayment_returnsFalse_agentNotActive() public {
        _registerAgent(false);
        vm.prank(human);
        policy.deactivateAgent(agent);

        (bool allowed, string memory reason) = policy.checkPayment(agent, merchant, PER_TX);
        assertFalse(allowed);
        assertEq(reason, "agent_not_active");
    }

    function test_checkPayment_returnsFalse_merchantNotAllowed() public {
        _registerAgent(true);
        (bool allowed, string memory reason) = policy.checkPayment(agent, merchant, PER_TX);
        assertFalse(allowed);
        assertEq(reason, "merchant_not_allowed");
    }

    function test_checkPayment_returnsFalse_exceedsPerTx() public {
        _registerAgent(false);
        (bool allowed, string memory reason) = policy.checkPayment(agent, merchant, PER_TX + 1);
        assertFalse(allowed);
        assertEq(reason, "exceeds_per_tx_limit");
    }

    function test_checkPayment_returnsFalse_exceedsDaily() public {
        _registerAgent(false);
        // Spend the budget first
        _fundAndApprove(agent, DAILY);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        (bool allowed, string memory reason) = policy.checkPayment(agent, merchant, PER_TX);
        assertFalse(allowed);
        assertEq(reason, "exceeds_daily_limit");
    }

    function test_checkPayment_accountsForWindowReset() public {
        _registerAgent(false);
        // Fill daily budget
        _fundAndApprove(agent, DAILY);
        for (uint256 i = 0; i < 5; i++) {
            vm.prank(agent);
            policy.executePayment(merchant, PER_TX, INTENT);
        }

        // Still blocked before window resets
        (bool allowed,) = policy.checkPayment(agent, merchant, PER_TX);
        assertFalse(allowed);

        // Warp past window
        vm.warp(block.timestamp + 25 hours);

        (allowed,) = policy.checkPayment(agent, merchant, PER_TX);
        assertTrue(allowed);
    }

    // ─────────────────────────────────────────────────────────
    // getRemainingDailyBudget tests
    // ─────────────────────────────────────────────────────────

    function test_remainingBudget_fullAfterWindowReset() public {
        _registerAgent(false);
        _fundAndApprove(agent, PER_TX);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        vm.warp(block.timestamp + 25 hours);

        assertEq(policy.getRemainingDailyBudget(agent), DAILY);
    }

    function test_remainingBudget_decreasesAfterPayment() public {
        _registerAgent(false);
        assertEq(policy.getRemainingDailyBudget(agent), DAILY);

        _fundAndApprove(agent, PER_TX);
        vm.prank(agent);
        policy.executePayment(merchant, PER_TX, INTENT);

        assertEq(policy.getRemainingDailyBudget(agent), DAILY - PER_TX);
    }

    // ─────────────────────────────────────────────────────────
    // Ownership tests
    // ─────────────────────────────────────────────────────────

    function test_transferProtocolOwnership_twoStep() public {
        address newOwner = makeAddr("newOwner");

        vm.prank(protocolOwner);
        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.ProtocolOwnershipTransferStarted(protocolOwner, newOwner);
        policy.transferProtocolOwnership(newOwner);

        assertEq(policy.pendingProtocolOwner(), newOwner);

        vm.prank(newOwner);
        vm.expectEmit(true, true, false, false);
        emit SpendPolicy.ProtocolOwnershipTransferred(protocolOwner, newOwner);
        policy.acceptProtocolOwnership();

        assertEq(policy.protocolOwner(), newOwner);
        assertEq(policy.pendingProtocolOwner(), address(0));
    }

    function test_acceptOwnership_revertsIfNotPending() public {
        vm.prank(stranger);
        vm.expectRevert(SpendPolicy.NotPendingOwner.selector);
        policy.acceptProtocolOwnership();
    }

    function test_pause_onlyProtocolOwner() public {
        vm.prank(stranger);
        vm.expectRevert(SpendPolicy.NotProtocolOwner.selector);
        policy.pause();

        vm.prank(protocolOwner);
        policy.pause();
        assertTrue(policy.paused());
    }

    function test_unpause_onlyProtocolOwner() public {
        vm.prank(protocolOwner);
        policy.pause();

        vm.prank(stranger);
        vm.expectRevert(SpendPolicy.NotProtocolOwner.selector);
        policy.unpause();

        vm.prank(protocolOwner);
        policy.unpause();
        assertFalse(policy.paused());
    }

    // ─────────────────────────────────────────────────────────
    // Fuzz tests
    // ─────────────────────────────────────────────────────────

    function testFuzz_executePayment_neverExceedsLimits(
        uint256 amount,
        uint256 perTxLimit,
        uint256 dailyLimit
    ) public {
        perTxLimit = bound(perTxLimit, 1, type(uint128).max);
        dailyLimit = bound(dailyLimit, perTxLimit, type(uint128).max);
        amount     = bound(amount, 1, perTxLimit);

        address fuzzAgent = makeAddr("fuzzAgent");
        vm.prank(human);
        policy.registerAgent(fuzzAgent, perTxLimit, dailyLimit, false);

        usdc.mint(fuzzAgent, amount);
        vm.prank(fuzzAgent);
        usdc.approve(address(policy), amount);

        vm.prank(fuzzAgent);
        policy.executePayment(merchant, amount, INTENT);

        SpendPolicy.Policy memory p = policy.getPolicy(fuzzAgent);
        assertLe(p.dailySpent, dailyLimit);
        assertLe(amount, perTxLimit);
    }
}
