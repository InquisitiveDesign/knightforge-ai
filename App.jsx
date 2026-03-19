import React,{useEffect,useRef,useState} from "react";
import {Chess} from "chess.js";
import {Chessboard} from "react-chessboard";

export default function App(){

const [game,setGame]=useState(new Chess());
const [fen,setFen]=useState(game.fen());
const [history,setHistory]=useState([]);
const [evalScore,setEval]=useState(0);
const [best,setBest]=useState("-");
const [depth,setDepth]=useState(12);
const [engineReady,setEngineReady]=useState(false);

const engine=useRef(null);

useEffect(()=>{

    engine.current = new Worker("/engine/stockfish.js");

    engine.current.onmessage=(e)=>{

    let line=e.data;

    if(line.includes("uciok")){
    console.log("Engine ready");
    }

    if(line.includes("score cp")){
    let v=line.split("score cp ")[1].split(" ")[0];
    setEval((v/100).toFixed(2));
    }

    if(line.includes(" pv ")){
    let mv=line.split(" pv ")[1].split(" ")[0];
    setBest(mv);
    }

    if(line.includes("bestmove")){
    let mv=line.split("bestmove ")[1].split(" ")[0];

    move({
    from:mv.slice(0,2),
    to:mv.slice(2,4),
    promotion:'q'
    });

    }

    };

    engine.current.postMessage("uci");

    return()=>{
    engine.current.terminate();
    };

},[]);

function evalPos(f){
engine.current.postMessage("position fen "+f);
engine.current.postMessage("go depth "+depth);
}

function move(m){
let g=new Chess(game.fen());
let r=g.move(m);

if(r){
setGame(g);
setFen(g.fen());
setHistory(g.history());

evalPos(g.fen());

setTimeout(()=>{
if(g.turn()==='b' && !g.isGameOver()){
engine.current.postMessage("position fen "+g.fen());
engine.current.postMessage("go depth "+depth);
}
},300);

return true;
}

return false;
}

function newGame(){
let g=new Chess();
setGame(g);
setFen(g.fen());
setHistory([]);
}

return(
<div style={{
fontFamily:'Arial',
display:'flex',
flexDirection:'column',
alignItems:'center',
padding:'20px',
maxWidth:'1200px',
margin:'auto'
}}>

<h1>KnightForge AI ♟️</h1>

<p style={{
color:'gray',
marginBottom:'25px'
}}>
Free AI chess trainer – Beta testing version
</p>

<div style={{display:'flex',gap:'40px'}}>

<div>

<Chessboard
position={fen}
onPieceDrop={(s,t)=>move({from:s,to:t,promotion:'q'})}
boardWidth={520}
/>

<button
onClick={newGame}
style={{
marginTop:'15px',
padding:'10px 20px',
cursor:'pointer',
borderRadius:'8px'
}}
>
New Game
</button>

</div>

<div style={{width:'280px'}}>

<h3>Engine Analysis</h3>

<p>Evaluation: {evalScore}</p>
<p>Best move: {best}</p>

<p>Engine strength</p>

<input
 type="range"
 min="6"
 max="22"
 value={depth}
 onChange={(e)=>setDepth(e.target.value)}
/>

<h3>Moves</h3>

<div style={{
maxHeight:'300px',
overflow:'auto',
border:'1px solid lightgray',
padding:'10px'
}}>

{history.map((m,i)=>(
<div key={i}>{i+1}. {m}</div>
))}

</div>

<div style={{marginTop:'20px'}}>

<b>Feedback</b>

<p style={{fontSize:'14px'}}>
Testing beta version.
Share feedback with developer.
</p>

</div>

</div>

</div>

<footer style={{
marginTop:'40px',
color:'gray',
fontSize:'14px'
}}>
KnightForge AI – Experimental chess improvement platform
</footer>

</div>
);

}