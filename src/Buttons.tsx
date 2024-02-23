//Import needed modules
import React from 'react'


//Define Properties for the buttons (Taking in onClicks)
interface ButtonProperties {
    onClick:() => void;
    buttonLabel: string;
    btnClass?: string;
}

//Create a button component and a render method that returns how the button is displayed
const Buttons: 
React.FC<ButtonProperties> = ({ onClick, buttonLabel, btnClass}) => {
    return (
        <button className = {btnClass} onClick = {onClick}>{buttonLabel}</button>
    );
}

//Export the component for use
export default Buttons;