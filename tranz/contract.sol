// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

contract TransferMoney {
    struct User {
        string name;
        uint role;
    }

    struct Transfer {
        uint transfer_id;
        address owner;
        address somebody;
        uint256 amount;
        bool status;
        bytes32 secret_key;
        uint wrongAttempts;
    }

    mapping(address => User) public users;
    Transfer[] public transfers;
    address[] public usersArr;

    constructor() {
        users[msg.sender] = User("Dmitriy", 0);
        users[0xDD93e94fA669A405E743EE45f13BcACC445A33F9] = User("Maxim", 1);

    }

    function create_user(string memory _name, address _user) public {
        require(users[msg.sender].role == 1, "You are not admin!");
        users[_user] = User(_name, 0);
        usersArr.push(_user);
    }

    function create_offer(address _somebody, string memory _secret_key) public payable {
        require(msg.value > 0, "Infussicient value sent");
        require(msg.sender != _somebody, "You cant pay to yourself");

        transfers.push(Transfer(transfers.length, msg.sender, _somebody, msg.value, true, keccak256(abi.encodePacked(_secret_key)),0));
    }

    function accept_offer(uint _transferID, bytes32 _user_secret_key) public {
    require(transfers[_transferID].status, "This offer is not available!");
    require(msg.sender == transfers[_transferID].somebody, "You are not somebody in transfer!");

    if (_user_secret_key == transfers[_transferID].secret_key) {
        payable(msg.sender).transfer(transfers[_transferID].amount);
        transfers[_transferID].status = false;
        transfers[_transferID].wrongAttempts = 0; // Сбрасываем счетчик неправильных попыток
    } else {
        transfers[_transferID].wrongAttempts++; // Увеличиваем счетчик неправильных попыток
        if (transfers[_transferID].wrongAttempts >= 3) {
            payable(transfers[_transferID].owner).transfer(transfers[_transferID].amount);
            transfers[_transferID].status = false;
            transfers[_transferID].wrongAttempts = 0; // Сбрасываем счетчик неправильных попыток
        }
    }
}

    function cancel_offer(uint _userID) public {
        require(msg.sender == transfers[_userID].owner, "You are not owner in this transfer");
        require(transfers[_userID].status, "Transfer already accept");

        payable(msg.sender).transfer(transfers[_userID].amount);

        transfers[_userID].status = false;
    }

    function change_role(address _somebody) public {
        require(users[msg.sender].role == 1, "You are not admin!");
        users[_somebody].role = 1;
    }

    function getTransfers() public view returns (Transfer[] memory) {
        return transfers;
    }

    function getUsers() public view returns(address[] memory) {
        return usersArr;
    }
}