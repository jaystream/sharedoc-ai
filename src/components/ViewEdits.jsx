import React from 'react'
import { convertUnicode, removeTags } from '../helper'

const ViewEdits = ({edits}) => {
  
  return (
    <div>
      <table className="table small">
        <thead>
          <th>Action</th>
          <th>Content</th>
        </thead>
        <tbody>
          {
            
            edits?.map((v,i) => {
              return v?.diffs?.map((diffVal,diffKey) => {
                if(diffVal[0] != 0){
                  return <tr key={diffKey}>
                    <td>{diffVal[0] == 1 ? 'Added': 'Deleted'}</td>
                    <td>{removeTags(convertUnicode(diffVal[1],true))}</td>
                  </tr>
                }
              })
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export default ViewEdits
