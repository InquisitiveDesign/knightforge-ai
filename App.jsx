import React,{useEffect,useRef,useState} from "react";
import {Chess} from "chess.js";
import {Chessboard} from "react-chessboard";

export default function App(){

const playerColor="w";

const [game,setGame]=useState(new Chess());
const [fen,setFen]=useState(game.fen());
const [history,setHistory]=useState([]);
const [evalScore,setEval]=useState(0);
const [prevEval,setPrevEval]=useState(0);
const [moveQuality,setMoveQuality]=useState("-");
const [best,setBest]=useState("-");
const [depth,setDepth]=useState(12);
const [thinking,setThinking]=useState(false);
const [engineReady,setEngineReady]=useState(false);
const [status,setStatus]=useState("Game running");

const engine=useRef(null);

useEffect(()=>{

engine.current=new Worker("/engine/stockfish.js");

engine.current.onmessage=(e)=>{

let line=e.data;

if(line==="uciok"){
setEngineReady(true);
}

if(line.includes("score cp")){

let v=line.split("score cp ")[1].split(" ")[0];

let current=(v/100);

setEval(current.toFixed(2));

let diff=Math.abs(prevEval-current);

if(diff<0.3) setMoveQuality("Best");
else if(diff<0.8) setMoveQuality("Good");
else if(diff<1.5) setMoveQuality("Inaccuracy");
else if(diff<3) setMoveQuality("Mistake");
else setMoveQuality("Blunder");

}

if(line.includes(" pv ")){

let mv=line.split(" pv ")[1].split(" ")[0];

setBest(mv);

}

if(line.includes("bestmove")){

setThinking(false);

let mv=line.split("bestmove ")[1].split(" ")[0];

let g=new Chess(game.fen());

g.move({

from:mv.slice(0,2),
to:mv.slice(2,4),
promotion:'q'

});

updateGame(g);

}

};

engine.current.postMessage("uci");

return()=>{

engine.current.terminate();

};

},[game,prevEval]);

function evalPosition(f){

engine.current.postMessage("position fen "+f);

engine.current.postMessage("go depth "+depth);

}

function updateGame(g){

setGame(g);

setFen(g.fen());

setHistory(g.history());

evalPosition(g.fen());

checkGameState(g);

}

function checkGameState(g){

if(g.isCheckmate()){

setStatus("Checkmate");

}

else if(g.isStalemate()){

setStatus("Stalemate");

}

else if(g.isDraw()){

setStatus("Draw");

}

else if(g.isCheck()){

setStatus("Check");

}

else{

setStatus("Game running");

}

}

function playerMove(m){

if(game.turn()!==playerColor){
return false;
}

setPrevEval(Number(evalScore));

let g=new Chess(game.fen());

let result=g.move(m);

if(!result){
return false;
}

updateGame(g);

if(g.turn()==='b' && !g.isGameOver()){

setThinking(true);

setTimeout(()=>{

engine.current.postMessage("position fen "+g.fen());

engine.current.postMessage("go depth "+depth);

},200);

}

return true;

}

function newGame(){

let g=new Chess();

setGame(g);

setFen(g.fen());

setHistory([]);

setBest("-");

setEval(0);

setPrevEval(0);

setMoveQuality("-");

setStatus("Game running");

}

return(

<div style={

{

fontFamily:'Arial',

display:'flex',

flexDirection:'column',

alignItems:'center',

padding:'20px',

maxWidth:'1200px',

margin:'auto'

}

}>

<h1>KnightForge AI ♟️</h1>

<p style={{color:'gray'}}>

AI Chess Trainer – Beta

</p>

<p>

Engine: {engineReady?"Ready":"Loading"} |
AI: {thinking?"Thinking":"Idle"}

</p>

<h3>Status: {status}</h3>

<div style={{display:'flex',gap:'40px'}}>

<div>

<Chessboard

position={fen}

boardWidth={520}

onPieceDrop={(s,t)=>playerMove({

from:s,

to:t,

promotion:'q'

})}

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

<div style={{width:'300px'}}>

<h3>Engine Analysis</h3>

<p>Evaluation: {evalScore}</p>

<p>Best move: {best}</p>

<p>Your move quality: <b>{moveQuality}</b></p>

<p>Engine strength</p>

<input

type="range"

min="6"

max="22"

value={depth}

onChange={(e)=>setDepth(Number(e.target.value))}

/>

<h3>Moves</h3>

<div style={{

maxHeight:'260px',

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

</p>

<a

href="https://forms.gle/aSuX5EZ2NYNHJFUd7"

target="_blank"

rel="noopener noreferrer"

style={{

display:'inline-block',

marginTop:'8px',

padding:'8px 14px',

background:'#2563eb',

color:'white',

textDecoration:'none',

borderRadius:'6px'

}}

>

Give Feedback

</a>

</div>

</div>

</div>

<footer style={{

marginTop:'40px',

color:'gray',

fontSize:'14px'

}}>

KnightForge AI – AI Training Platform Prototype

</footer>

</div>

);

}
