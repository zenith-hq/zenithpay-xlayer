// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Script.sol";
import "../src/SpendPolicy.sol";

contract DeploySpendPolicy is Script {
    function run() external {
        // USDG on X Layer — 0x4ae46a509f6b1d9056937ba4500cb143933d2dc8
        address usdc = vm.envAddress("USDG_ADDRESS");
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerKey);
        SpendPolicy policy = new SpendPolicy(usdc);
        vm.stopBroadcast();

        console.log("SpendPolicy deployed at:", address(policy));
    }
}
