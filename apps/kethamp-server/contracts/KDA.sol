// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract KDA is ERC20, ERC20Burnable, Ownable {
    uint constant _initial_supply = 100 * (10 ** 18);
    event Transfer(address indexed to, uint256 indexed value);
    event CROSS_CHAIN_INIT(address sender, address recipient, uint amount, string targetChain);

    mapping(string => address) crossChainAddresses;

    struct XChainBurn {
        address contract_addr;
        address sender;
        address receiver;
        uint256 amount;
        uint256 block_height;
        string  target_chain;
    }


    struct XChainBurnOld {
       address contract_addr;
       address account;
       uint256 amount;
       uint256 block_height;
    }

    constructor() ERC20("KDA", "KDA") Ownable(msg.sender) {
        _mint(msg.sender, _initial_supply);
    }

    function getCrossChainAddress(string memory id) public view returns (address) {
        return crossChainAddresses[id];
    }

    function setCrossChainAddress(string memory id, address crossChainAddress) public onlyOwner {
        crossChainAddresses[id] = crossChainAddress;
    }

    function crossChainTransfer(address sender, address recipient, uint amount, string memory targetChain) public {
        burn(amount);
        emit Transfer(recipient, amount);
        emit CROSS_CHAIN_INIT(sender, recipient, amount, targetChain);
    }

    function verifySPV(XChainBurn memory eventQuery) public returns (bool) {
        address REDEEM_PRECOMPILE = address(0x0000000000000000000000000000000000000421);

        XChainBurnOld memory eventQueryOld = XChainBurnOld({
            contract_addr: eventQuery.contract_addr,
            account: eventQuery.receiver,
            amount: eventQuery.amount,
            block_height: eventQuery.block_height
        });
        (bool verified, bytes memory data) = REDEEM_PRECOMPILE.call(abi.encode(eventQueryOld));

        XChainBurnOld memory event_data = abi.decode(data, (XChainBurnOld));
        // require(event.contract_addr   == address(this),       "Contract address does not match");

        // require(event_data.sender          == eventQuery.sender,    "Account does not match");
        require(event_data.account        == eventQuery.receiver,      "Account does not match");
        require(event_data.amount         == eventQuery.amount,        "Amount does not match");
        require(event_data.block_height   == eventQuery.block_height,  "Block height does not match");
        require(event_data.contract_addr  == eventQuery.contract_addr, "Target chain does not match");
        require(verified, "SPV verification failed");
        return verified;
    }
    function crossChainReceive(
      address sender,
      address receiver,
      uint amount,
      string memory targetChain,
      uint blockHeight,
      string memory originChain
    ) public {
        XChainBurn memory eventQuery;

        eventQuery.contract_addr = getCrossChainAddress(originChain);
        eventQuery.sender        = sender;
        eventQuery.receiver      = receiver;
        eventQuery.amount        = amount;
        eventQuery.block_height  = blockHeight;
        eventQuery.target_chain  = targetChain;

        // require(verifySPV(eventQuery), "SPV verification failed");
        _mint(receiver, amount);
    }
}
