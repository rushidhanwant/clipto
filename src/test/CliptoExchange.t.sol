// SPDX-License-Identifier: None
pragma solidity 0.8.10;

import {CliptoExchange} from "../CliptoExchange.sol";
import {CliptoToken} from "../CliptoToken.sol";
import {DSTestPlus} from "lib/solmate/src/test/utils/DSTestPlus.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract CliptoExchangeTest is DSTestPlus, IERC721Receiver {
    CliptoExchange exchange;

    function setUp() external {
        exchange = new CliptoExchange();
    }

    function testCreatorRegistration() public {
        // Register creator.
        exchange.registerCreator("Gabriel Haines", 1e18);

        // Retrieve creator information.
        (string memory name, uint256 cost, address token) = exchange.creators(address(this));

        // Ensure the data returned is correct.
        assertEq(name, "Gabriel Haines");
        assertEq(cost, 1e18);
        assertEq(token, address(0));
    }

    function testRequestCreation() public {
        // Register a creator.
        testCreatorRegistration();

        // Create a new request (the creator address is address(this))
        exchange.newRequest{value: 1e18}(address(this));

        // Check that the request was created
        (address requester, uint256 value, bool delivered) = exchange.requests(address(this), 0);

        // Ensure the data returned is correct.
        assertEq(requester, address(this));
        assertEq(value, 1e18);
        assertFalse(delivered);
    }

    function testRequestDelivery() public {
        testRequestCreation();

        uint256 balanceBefore = address(this).balance;
        exchange.deliverRequest(0, "http://website.com");
        (,, bool delivered) = exchange.requests(address(this), 0);
        (,, address token) = exchange.creators(address(this));

        assertTrue(delivered);
        assertTrue(address(this).balance > balanceBefore + 9e17);
        assertEq(CliptoToken(token).name(), "Clipto - Gabriel Haines");
    }

    function onERC721Received(
        address,
        address,
        uint256 tokenId,
        bytes calldata
    ) external override returns (bytes4) {
        assertEq(tokenId, 0);
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
