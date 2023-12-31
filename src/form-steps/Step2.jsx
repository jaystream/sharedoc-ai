import React from "react";
import Web3 from 'web3';
import PropTypes from "prop-types";
import Upload from '../artifacts/contracts/Upload.sol/Upload.json'
import { useForm } from "react-hook-form";
import { useState, useEffect } from '@wordpress/element';
import axiosClient from "../axios";
import { swal2 } from "../helper";
const reactAppData = window.xwbVar || {}

const Step2 = ({ shareDoc, setShareDoc, handleConnect }) => {
  const { register, setError, reset, formState: { errors }, handleSubmit } = useForm();
  const [step2, setStep2] = useState({
    file: null,
    sharing: false,
    adding: false,
    emails: []
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
    
    let contract = shareDoc.contract;
    let walletAddress = shareDoc.account.address;
    contract.methods.allow(shareDoc.email, data.email).send(
      {
        from: walletAddress
      }).then(result => {
        
        let addUserPermissionData = {
          action: 'addPermissions',
          post_id: shareDoc.post_id,
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
            title: 'Uploaded!',
            type: 'success',
            message: responseData.data.message,
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
      });
     
    
    
  }

  const getEmails = () => {
    axiosClient.get(`${reactAppData.ajaxURL}`,{ 
      params: { 
        post_id: shareDoc.post_id,
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
  useEffect( ()=>{
    getEmails();
  },[web3]);
  
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
          <p>Transaction: {shareDoc?.transactionHash}</p>
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
          {/* <div className='mb-3'>
            <label className=''>Select Permission(s)</label>
            {
              
              permissions?.map((val,index)=>{

                return (
                  <div key={index} className="form-check">
                    <input id={`check-${val.key}`} value={val.key} {...register(`permissions[]`)} type="checkbox" className="form-check-input" />
                    <label htmlFor={`check-${val.key}`} className="form-check-label">{val.name}</label>
                  </div>
                )
              })
            }
            {errors?.permissions && <small className="input-errors text-red-500">{errors.permissions.message}</small>}
          </div> */}
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
                <th>Name</th>
                <th>Email</th>
                {/* <th>Permissions</th> */}
              </tr>
            </thead>
            <tbody>
              {step2?.emails?.map((i,k)=>{
                return (
                  <>
                  <tr>
                    <td>{`${i.first_name} ${i.last_name}`}</td>
                    <td>{i.email}</td>
                    {/* <td>
                      <ul>
                      
                      {
                        permissions.map((val,k)=>{
                          
                          if(i?.permissions?.includes(val.key)){
                            return (
                              <li>{val.name}</li>
                            )
                          }
                            
                        })
                      }
                      </ul>
                    </td> */}
                  </tr>
                  </>
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
          }}>View Files</a>
        </div>
      </div>
    </>
  );
};

Step2.propTypes = {};

export default Step2;
