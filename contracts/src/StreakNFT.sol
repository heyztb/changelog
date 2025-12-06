// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@solady/auth/Ownable.sol";
import {ERC721} from "@solady/tokens/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {IStreakTracker} from "./interfaces/IStreakTracker.sol";

/// @title StreakNFT
/// @notice A contract that will mint NFTs after a user has achieved a streak threshold.
contract StreakNFT is Ownable, ERC721 {
    string public constant baseURI = "https://changelog.xyz/streak/";
    uint256 public tokenId = 0;

    IStreakTracker public immutable streakTracker;
    /// @notice Mapping of authorized resolvers that can mint NFTS on behalf of users
    mapping(address => bool) public authorizedResolvers;
    mapping(uint256 => uint256) public tokenIdToMilestone;

    /// @notice Emitted when a resolver is authorized or deauthorized
    event ResolverAuthorizationChanged(
        address indexed resolver,
        bool authorized
    );

    error UnauthorizedResolver();

    constructor(IStreakTracker _streakTracker) {
        _initializeOwner(msg.sender);
        streakTracker = _streakTracker;
    }

    /// @dev Modifier to restrict function access to authorized resolvers only
    modifier onlyAuthorizedResolver() {
        if (!authorizedResolvers[msg.sender]) {
            revert UnauthorizedResolver();
        }
        _;
    }

    /// @notice Authorizes or deauthorizes a resolver
    /// @dev Only owner can call this function
    /// @param resolver The address of the resolver contract
    /// @param authorized True to authorize, false to deauthorize
    function setResolverAuthorization(
        address resolver,
        bool authorized
    ) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorizationChanged(resolver, authorized);
    }

    function name() public view virtual override returns (string memory) {
        return "Changelog Streak";
    }

    /// @dev Returns the token collection symbol.
    function symbol() public view virtual override returns (string memory) {
        return "CLST";
    }

    /// @dev Returns the Uniform Resource Identifier (URI) for token `id`.
    ///      This implementation returns fully on-chain metadata as a base64-encoded
    ///      JSON data URI. The image is an SVG encoded as base64 and embedded
    ///      into the metadata so all metadata lives on-chain.
    function tokenURI(
        uint256 id
    ) public view virtual override returns (string memory) {
        uint256 milestone = tokenIdToMilestone[id];
        string memory milestoneStr = Strings.toString(milestone);
        string memory idStr = Strings.toString(id);

        // Friendly name & description
        string memory tokenName = string.concat(
            "Changelog Streak #",
            idStr,
            unicode" — ",
            milestoneStr,
            " day streak"
        );
        string
            memory description = "An on-chain NFT representing a Changelog streak milestone. Metadata and image are stored on-chain.";

        // Choose a color based on milestone thresholds (few thresholds only, kept simple)
        string memory color;
        if (milestone >= 365) {
            color = "#ffd700"; // gold
        } else if (milestone >= 100) {
            color = "#c0c0c0"; // silver
        } else if (milestone >= 30) {
            color = "#cd7f32"; // bronze
        } else {
            color = "#6ec1ff"; // blue for starter streaks
        }

        // Build a small SVG image
        string memory svg = string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<rect width="100%" height="100%" fill="',
            color,
            '"/>',
            '<g fill="#000000" font-family="Arial, Helvetica, sans-serif">',
            '<text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-size="28">Changelog</text>',
            '<text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="20">',
            milestoneStr,
            "-day streak</text>",
            "</g>",
            "</svg>"
        );
        string memory json = string.concat(
            '{"name":"',
            tokenName,
            '","description":"',
            description,
            '","image":data:/image/svg+xml;base64,"',
            Base64.encode(bytes(svg)),
            '","attributes":[{"trait_type":"milestone","value":"',
            milestoneStr,
            '"}]}'
        );

        return string.concat("data:applicaton/json;base64,", json);
    }

    function mint(address to, uint256 milestone) public onlyAuthorizedResolver {
        ++tokenId;
        tokenIdToMilestone[tokenId] = milestone;
        _safeMint(to, tokenId);
    }
}
