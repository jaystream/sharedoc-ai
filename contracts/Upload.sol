// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.19 <=0.8.22;
import "hardhat/console.sol";
/**
  * @title Upload
  * @dev Upload
  * @custom:dev-run-script scripts/Upload.ts
  */
contract Upload {
  string[3] internal permissions=["r", "w", "x"];
    
  struct Access{
    string email; 
    bool access; //true or false
    string permissions;
  }

  mapping(string=>mapping(string=>string)) public files;
  //mapping(address=>string[]) value;
  mapping(string=>mapping(string=>bool)) public ownership;
  mapping(string=>Access[]) accessList;
  mapping(string=>mapping(string=>bool)) previousData;

  function getSender() public view returns (address) {
    return msg.sender;
  }

  

  function allow(string memory email, string memory email_to) external{//def
    ownership[email][email_to]=true; 
    if(previousData[email][email_to]){
      for(uint i=0;i<accessList[email].length;i++){
        if(compare(accessList[email][i].email, email_to)){
          accessList[email][i].access=true; 
          accessList[email][i].permissions='r'; 
        }
      }
    }else{
      accessList[email].push(Access(email_to,true,'r'));  
      previousData[email][email_to]=true;  
    }
  }

  function addFile(string memory email, string memory post_id) external{
    files[email]['file'] = post_id;
    files[email]['permission'] = permissions[1];
  }

  function compare(string memory str1, string memory str2) public pure returns (bool) {
      if (bytes(str1).length != bytes(str2).length) {
          return false;
      }
      return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
  }
  /* function add(address _user,string memory url) external {
    value[_user].push(url);
    allow(_user);
  } */

  function disallow(string memory email, string memory email_to) public{
    ownership[email][email_to]=false;
    for(uint i=0;i<accessList[email].length;i++){
      if(compare(accessList[email][i].email, email_to)){
        accessList[email][i].access=false;  
      }
    }
  }

  function display(string calldata email, string calldata owner_email) public view returns(string memory){
    require(compare(email, owner_email) || ownership[owner_email][email],"You don't have access from this file");
    // || ownership[msg.sender][_user]
    return files[owner_email]['file'];
  }
    

/*     function getOwnerships(address _user) external view returns(address[] memory){
      return accessList;
    } */
    
    function shareAccess(string memory email) public view returns(Access[] memory){
      return accessList[email];
    }
}