import React from "react";
import Web3 from 'web3';
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect } from '@wordpress/element';
import axiosClient from "../axios";
import { swal2 } from "../helper";
import { useNavigate, useParams } from "react-router-dom";
const reactAppData = window.xwbVar || {}

const Step2 = ({ shareDoc, setShareDoc, handleConnect }) => {
  let { fileHash } = useParams();
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const [step2, setStep2] = useState({
    file: null,
    sharing: false,
    showTransaction: false,
    transactionHash: null,
    title: '',
    adding: false,
    emails: [],
    post_id: null
  });
  const web3 = shareDoc?.web3;
  const transactionHash = shareDoc?.transactionHash || '0x6f611d80c19bbac5a361de53b69f65ff4382b1685e53e0b0e9ea8419aa3ca567'
  const account = shareDoc?.account;
  const contract = shareDoc?.contract;
  const permissions=[
    {
      key: 'r',
      name: 'Read',
    },
    {
      key: 'w',
      name: 'Write'
    },
    {
      key: 'x',
      name: 'Execute'
    }
  ];

  const navigate = useNavigate();


  const getFiles = async (web3) => {
    
    if(web3){
      let owner = await contract.methods.getSender().call();
      let files = await contract.methods.display(account.address).call({from: account.address});

      let trans = await web3.eth.getTransaction(transactionHash);
      
      const decoded = await web3.eth.abi.decodeParameters(
        [{
          type: 'address',
          name: '_user'
        },{
          type: 'string',
          name: 'url'
         }],
        trans.input.slice(10));
        
        setStep2((prev) => { 
          return {
            ...prev,
            file: decoded.url
          }
        });
    }
  }

  const onSubmit= async (data) => {
    setStep2((prev) => { 
      return {
        ...prev,
        adding: true
      }
    });
    
    let addUserPermissionData = {
      action: 'addPermissions',
      post_id: step2.post_id,
      share_to_email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      company: data.company,
      permissions: data.permissions
    }
    axiosClient.post(`${reactAppData.ajaxURL}`,addUserPermissionData).then( async response => {
      
      let responseData = response.data;
      getEmails();
      reset();
      swal2({
        title: 'Shared!',
        type: 'success',
        message: responseData.data.message,
        didClose: ()=>{

        }
      });
    }).catch(function (error) {
      let errorData = error.response.data;
      
      let jsonError = error.toJSON();
      //console.log(jsonError);
      swal2({
        title: 'Error!',
        type: 'error',
        message: errorData.data.message,
        didClose: ()=>{

        }
      });
    });

    setStep2((prev) => { 
      return {
        ...prev,
        adding: false
      }
    });
     
    
    
  }

  const getEmails = () => {
    axiosClient.get(`${reactAppData.ajaxURL}`,{ 
      params: { 
        post_id: step2.post_id,
        action: 'getEmails',
      } 
    }).then(response => {
      let data = response.data;
      setStep2((prev) => { 
        return {
          ...prev,
          emails: data
        }
      });
    });
  }

  const setFileInfo = (fileHash) =>
  {
    
    axiosClient.get(`${reactAppData.ajaxURL}`,{ 
      params: { 
        file_hash: fileHash,
        action: 'getTransactionByHash',
      } 
    }).then(response => {
      let responseData = response.data;
      let data = responseData?.data;

      setStep2((prev) => { 
        return {
          ...prev,
          transactionHash: data.block_hash,
          title: data.title,
          post_id: data.post_id,
          emails: data.emails
        }
      });
      
    });
  }
  useEffect( ()=>{
    setFileInfo(fileHash);
  },[fileHash]);
  
  return (
    <>
      <div className="row">
        <div className="col-md-9">

        </div>
        <div className="col-md-3">
          
        </div>
      </div>
      <div className="row">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="app-title">Step 2</h2>
          
          <p>Title: {step2?.title}</p>
          <div className="mb-3">
            <label htmlFor="wallet_to" className="form-label">Add user to share </label>
            <div className="row">
              <div className="col">
                <input type="text" name="first_name" placeholder="First name" {...register('first_name',{
                  required: "This field is required!"
                })} className={`form-control rounded-pill xwb-input ${errors?.first_name ? 'border-danger': ''}`} id="first_name" />
                {errors?.first_name && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.first_name?.message}}></small>}
              </div>

              <div className="col">
                <input type="text" name="last_name" placeholder="Last name" {...register('last_name',{
                  required: "This field is required!"
                })} className={`form-control rounded-pill xwb-input ${errors?.last_name ? 'border-danger': ''}`} id="last_name" />
                {errors?.last_name && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.last_name?.message}}></small>}
              </div>
            </div>
          </div>
          <div className="mb-3">
            <input type="text" name="company" placeholder="Company (Optional)" {...register('company')} className={`form-control rounded-pill xwb-input ${errors?.company ? 'border-danger': ''}`} id="company" />
            {errors?.company && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.company?.message}}></small>}
          </div>
          <div className="mb-3">
            <input type="email" name="email" placeholder="Email" {...register('email',{
                  required: "This field is required!"
                })} className={`form-control rounded-pill xwb-input ${errors?.email ? 'border-danger': ''}`} id="email" />
            {errors?.email && <small className="input-errors text-danger" dangerouslySetInnerHTML={{__html: errors.email?.message}}></small>}
          </div>
          
          <div className="mb-3">
          <button
              type="submit"
              className="btn bg-green-400 rounded-pill px-3"
            ><i className="fa-solid fa-plus"></i> 
              Add User
              {step2?.adding && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            </button>
          </div>
        </form>
      </div>
      <div className="row">
        <div className="col-md-12">
          <table className="table">
            <thead>
              <tr>
                <th colSpan={2}><p className="text-center mb-0">File Access</p></th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {/* <th>Permissions</th> */}
              </tr>
            </thead>
            <tbody>
              {step2?.emails?.map((i,k)=>{
                return (
                  <tr key={k}>
                    <td>{`${i.first_name} ${i.last_name}`}</td>
                    <td>{i.email}</td>
                  </tr>
                )
              })}
              {step2?.emails.length == 0 && <tr><td colSpan={2}>No Records Found!</td></tr>}
              
            </tbody>
            
          </table>
        </div>
      </div>
      <div className="row">
        <div className="col">
        <a href="" className="btn bg-blue-400 rounded-pill px-3" onClick={(e)=>{
            e.preventDefault();
            setShareDoc((prev) => { 
              return {
                ...prev,
                step: 3
              }
            });
            navigate('/')
          }}>View Files</a>
        </div>
      </div>
    </>
  );
};

Step2.propTypes = {};

export default Step2;
