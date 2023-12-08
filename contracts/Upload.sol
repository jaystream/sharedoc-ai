// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.19 <=0.8.22;
import "hardhat/console.sol";

contract Upload {

    address[] internal _ownership;
    struct Access{
        address user; 
        bool access; //true or false
    }

    mapping(address=>string[]) value;
    mapping(address=>mapping(address=>bool)) public ownership;
    mapping(address=>Access[]) accessList;
    mapping(address=>mapping(address=>bool)) previousData;

    function getSender() public view returns (address) {
        return msg.sender;
    }

  

    function allow(address user) public{//def
      ownership[msg.sender][user]=true; 
      if(previousData[msg.sender][user]){
         for(uint i=0;i<accessList[msg.sender].length;i++){
             if(accessList[msg.sender][i].user==user){
                  accessList[msg.sender][i].access=true; 
             }
         }
      }else{
          accessList[msg.sender].push(Access(user,true));  
          previousData[msg.sender][user]=true;  
      }

      
    }

    function add(address _user,string memory url) external {
      value[_user].push(url);
      allow(_user);
    }

    function disallow(address user) public{
      ownership[msg.sender][user]=false;
      for(uint i=0;i<accessList[msg.sender].length;i++){
          if(accessList[msg.sender][i].user==user){ 
              accessList[msg.sender][i].access=false;  
          }
      }
    }

    function display(address _user) public view returns(string[] memory){
      require(_user==msg.sender || ownership[_user][msg.sender],"You don't have access from this file");
      // || ownership[msg.sender][_user]
      return value[_user];
    }
    

/*     function getOwnerships(address _user) external view returns(address[] memory){
      return accessList;
    } */
    
    function shareAccess() public view returns(Access[] memory){
      return accessList[msg.sender];
    }
}
