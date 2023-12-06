import React from "react";
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect } from '@wordpress/element';

const Files = ({ shareDoc, setShareDoc, handleConnect }) => {
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const [files, setFiles] = useState({
    list: [],
    shared: []
  });
  const account = shareDoc?.wallet?.accounts[0];
  const web3 = shareDoc?.web3;

  const getFiles = async (web3) => {
    if(web3){
      const uploadContract = new web3.eth.Contract(Upload.abi,process.env.REACT_APP_CONTRACT_ADDRESS);
      let owner = await uploadContract.methods.getOwner().call();
      console.log(account,owner);
      await uploadContract.methods.display(account).call({from: owner}).then(data => {
        console.log(data);
        setFiles((prev)=>{
          return {
            ...prev,
            list: data
          }
        });
      });

      const accessList = await uploadContract.methods.shareAccess().call(
        {
          from: owner
        }, function(error, result){

      });

      

      
      /* let trans = await web3.eth.getTransaction(transactionHash);
      
      const decoded = await web3.eth.abi.decodeParameters(
        [{
          type: 'address',
          name: '_user'
        },{
          type: 'string',
          name: 'url'
         }],
        trans.input.slice(10)
      ); */
    }
  }


  useEffect( ()=>{
    getFiles(web3)
  },[web3]);

  return (
    <>
      <div className="row">
        <div className="col-md-12 mb-5">
          <h2 className="app-title">My Files</h2>
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>File</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {files?.list?.map((i,k)=> {
                return (<tr>
                  <td>{i}</td>
                  <td></td>
                </tr>)
              })}
            </tbody>
          </table>
        </div>
        <div className="col-md-12">
          <h2 className="app-title">Files Shared to me</h2>
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Action</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </>
  );
};

Files.propTypes = {};

export default Files;
