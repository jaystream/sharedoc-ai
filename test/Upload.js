const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  
  describe("Upload", function () {
    async function deployUploadFixture() {
      // Get the Signers here.
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call ethers.deployContract and await
      // its waitForDeployment() method, which happens once its transaction has been
      // mined.
      const hardhatUpload = await ethers.deployContract("Upload");
  
      await hardhatUpload.waitForDeployment();
  
      // Fixtures can return anything you consider useful for your tests
      return { hardhatUpload, owner, addr1, addr2 };
    }
    it("Will display owners uploaded file", async function () {
      const { hardhatUpload, owner } = await loadFixture(deployUploadFixture);
      const sender = await hardhatUpload.getOwner();
      const addFile = await hardhatUpload.add(sender, 'QmQGycKrnwePFo6tSaDdwSD8d1eShqDuZwe7sDXvszAb7z');
      const files = await hardhatUpload.display(sender);
      
      
      //await hardhatUpload.add(sender, 'QmP3oSuHUHaaYSwgsaUwmccb4yfNyLmwt1fibCYj9C2NwU');
      console.log(files);
    });
  });
  