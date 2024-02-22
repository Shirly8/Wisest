//Importing require modules
import React, {useState, useEffect} from 'react'
import Main from './main';


//Define the App Component by returning the main Component
const App = () => {
    
    return(
        <div className = "WiserChoice">

            <Main/>
        </div>
    );
}

//Export the component for use
export default Main;