// SPDX-License-Identifier: MIT

pragma solidity 0.8.30;

contract DecentralizedDataManagement {
    // ------------------ structs ------------------
    struct File {
        address owner;
        string cid;
        bytes capsule;
        bytes ciphertext;
        bool exist;
    }

    enum AccessStatus {
        NONE,
        PENDING,
        APPROVED,
        DENIED,
        REVOKED
    }

    // ------------------ mappings ------------------
    // map file hash to the access status of each user
    mapping(bytes32 => mapping(address => AccessStatus)) internal acl;
    // maps file hash to files
    mapping(bytes32 => File) internal fileMap;
    // map users to their public keys
    mapping(address => string) public publicKeys;
    // track pending requests per file for owner visibility
    mapping(bytes32 => address[]) internal pendingRequests;
    // track index of pending request for O(1) removal (1-based index to distinguish from 0 default)
    mapping(bytes32 => mapping(address => uint256))
        internal pendingRequestsIndex;

    // ------------------ events ------------------
    event userRegistered(address indexed user, string publicKey);
    event fileUploaded(bytes32 indexed hash, string cid, address indexed owner);
    event accessRequested(
        bytes32 indexed hash,
        string cid,
        address indexed owner,
        address indexed requester
    );
    event accessGranted(
        bytes32 indexed hash,
        string cid,
        address indexed owner,
        address indexed requester
    );
    event accessDenied(
        bytes32 indexed hash,
        string cid,
        address indexed owner,
        address indexed requester
    );
    event accessRevoked(
        bytes32 indexed hash,
        string cid,
        address indexed owner,
        address indexed user
    );

    // ------------------ registration ------------------
    function registerPublicKey(string calldata publicKey) external {
        publicKeys[msg.sender] = publicKey;
        emit userRegistered(msg.sender, publicKey);
    }

    function isRegistered(address user) external view returns (bool) {
        return bytes(publicKeys[user]).length > 0;
    }

    function registerFile(
        string calldata ipfsCid,
        bytes calldata capsule,
        bytes calldata ciphertext
    ) external {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        require(!fileMap[fileHash].exist, "File already registered");

        fileMap[fileHash] = File({
            owner: msg.sender,
            cid: ipfsCid,
            capsule: capsule,
            ciphertext: ciphertext,
            exist: true
        });

        acl[fileHash][msg.sender] = AccessStatus.APPROVED;
        emit fileUploaded(fileHash, ipfsCid, msg.sender);
    }

    // ------------------ access control ------------------
    function requestAccess(string calldata ipfsCid) external {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        _requireFileExists(fileHash);

        address requester = msg.sender;
        address owner = fileMap[fileHash].owner;

        require(owner != requester, "Owner has automatic access");
        require(
            acl[fileHash][requester] == AccessStatus.DENIED ||
                acl[fileHash][requester] == AccessStatus.NONE ||
                acl[fileHash][requester] == AccessStatus.REVOKED,
            "Request Pending or Approved"
        );

        acl[fileHash][requester] = AccessStatus.PENDING;
        pendingRequests[fileHash].push(requester);
        // Store 1-based index (length is new index)
        pendingRequestsIndex[fileHash][requester] = pendingRequests[fileHash]
            .length;

        emit accessRequested(fileHash, ipfsCid, owner, requester);
    }

    function grantAccess(string calldata ipfsCid, address requester) external {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        _requireFileExists(fileHash);
        _requireOwner(fileHash);

        // If there was a pending request, remove it
        if (acl[fileHash][requester] == AccessStatus.PENDING) {
            _removePendingRequest(fileHash, requester);
        }

        acl[fileHash][requester] = AccessStatus.APPROVED;
        emit accessGranted(fileHash, ipfsCid, msg.sender, requester);
    }

    function denyAccess(string calldata ipfsCid, address requester) external {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        _requireFileExists(fileHash);
        _requireOwner(fileHash);

        require(
            requester != msg.sender,
            "You cannot deny access from yourself"
        );
        require(
            acl[fileHash][requester] == AccessStatus.PENDING,
            "No pending request from this user"
        );

        acl[fileHash][requester] = AccessStatus.DENIED;
        _removePendingRequest(fileHash, requester);

        emit accessDenied(fileHash, ipfsCid, msg.sender, requester);
    }

    function revokeAccess(string calldata ipfsCid, address user) external {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        _requireFileExists(fileHash);
        _requireOwner(fileHash);

        require(user != msg.sender, "Cannot revoke owner access");
        require(
            acl[fileHash][user] == AccessStatus.APPROVED,
            "User does not have access"
        );

        acl[fileHash][user] = AccessStatus.REVOKED;
        emit accessRevoked(fileHash, ipfsCid, msg.sender, user);
    }

    function _removePendingRequest(
        bytes32 fileHash,
        address requester
    ) internal {
        // O(1) removal using swap and pop with index mapping
        uint256 index = pendingRequestsIndex[fileHash][requester];
        require(index > 0, "Request not found (index 0)");

        address[] storage requests = pendingRequests[fileHash];
        uint256 lastIndex = requests.length;

        if (index != lastIndex) {
            address lastRequester = requests[lastIndex - 1];
            requests[index - 1] = lastRequester;
            pendingRequestsIndex[fileHash][lastRequester] = index;
        }

        requests.pop();
        delete pendingRequestsIndex[fileHash][requester];
    }

    function _requireOwner(bytes32 fileHash) internal view {
        require(msg.sender == fileMap[fileHash].owner, "Not file owner");
    }

    function _requireFileExists(bytes32 fileHash) internal view {
        require(fileMap[fileHash].exist, "File does not exist");
    }

    // ------------------ getters ------------------
    function getAccessStatus(
        string calldata ipfsCid,
        address user
    ) external view returns (AccessStatus) {
        return acl[keccak256(abi.encode(ipfsCid))][user];
    }

    function getFile(
        string calldata ipfsCid
    ) external view returns (File memory) {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        return fileMap[fileHash];
    }

    function getFileOwner(
        string calldata ipfsCid
    ) external view returns (address) {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        require(fileMap[fileHash].exist, "File does not exist");
        return fileMap[fileHash].owner;
    }

    function getPendingRequests(
        string calldata ipfsCid
    ) external view returns (address[] memory) {
        bytes32 fileHash = keccak256(abi.encode(ipfsCid));
        return pendingRequests[fileHash];
    }
}
