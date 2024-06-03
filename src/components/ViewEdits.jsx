import React from 'react'
import { removeTags } from '../helper'

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
              return <tr key={i}>
                <td>{v.action == 1 ? 'Added': 'Deleted'}</td>
                <td>{removeTags(v.text)}</td>
              </tr>
            })
          }
        </tbody>
      </table>
    </div>
  )
}

export default ViewEdits
