import React from 'react';
import gemini from './images/gemini.png';


interface PopupProp {
  uniqueID: string;
  onClose: () => void;
  onDelete: () => void;
  onCopy: () => void;
}


const Popup: React.FC<PopupProp> = ({ uniqueID, onClose, onDelete, onCopy }) => {
  return (
    <div className="popup">
      <div className="popup-content">
        <h1 style ={{backgroundColor: '#C13B34', fontSize: '25px'}}>Decision Saved!</h1>
        <p>Your unique code is: {uniqueID}</p>
        <p>To retrieve, just enter this unique code at the homepage.</p>
        <button className = "startbutton" onClick={onDelete}>Delete</button>
        <button className = "startbutton" onClick={onCopy}>Copy</button>
        <button className = "startbutton" onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default Popup;
