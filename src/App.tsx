import React, {useState} from 'react';
import logo from './images/logo.png';
import './App.css';
import startimg from './images/main.png';
import Main from './Main';


function App() {

  //PART 1) START PAGE 
  const [start, setStart] = useState(false);
  const [retrieve, showretrieval] = useState(false);
  const [retrieveId, setretrieveId] = useState('')
  

  const reset = () => {
    setStart(false);
  }


  const handleRetrieve = () => {
    if (retrieveId) {
      fetch(`http://127.0.0.1:5000/get_decision/${retrieveId}`)
      .then((response) => response.json())
      .then((data) => {
        setStart(true);
      })
      .catch((error) => {
        alert("Cannot find ID. Please enter the correct ID or start over with START");
      });
    } else {
      setStart(true);
    }
  }


  return (
    start ? (
      <Main reset = {reset} id = {retrieveId}/>
    ): (
    <div className="Start">
        <img src = {startimg} className = "StartImage"></img>
        <div className = "LogoHeader">
        <img src={logo} className="App-logo" alt="logo" />
        <h1> Wisest</h1>
        </div>
        <div className = "container">
        <p>
        <strong>Stuck between endless options and possibilities? Wisest guides you to the wisest choice! Our simple decision-making algorithm takes account of all your metrics and categories. See how it works!</strong>
        </p>
        <button className = "startbutton" onClick = {() => handleRetrieve()}>START</button>
        <div style = {{margin: "2%"}}>
          <a href = "https://shirleyproject.com/wisest"><button className = "startbutton" style = {{marginTop: '-5px',}}>Learn More</button> </a>
        </div>

          <div>
          <input
            placeholder='To retrieve saved decision, enter unique code and hit START'
            style = {{width: '70%', fontSize: '15px', textAlign: 'center', color: 'white', border: '1px solid white', backgroundColor: 'transparent'}}
            value = {retrieveId}
            onChange = {(e) => setretrieveId(e.target.value)}
          ></input>
          </div>


  
        </div>
    </div>
    )
  );
}

export default App;
