import React from 'react'
import PropTypes from 'prop-types'

const Routing = props => {
    let location = useLocation();
    let match = useMatch('review');
    console.log(match);
  return (
    <div>
      
    </div>
  )
}

Routing.propTypes = {

}

export default Routing
