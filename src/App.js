import "./App.css";

import Chat from "./AudioChat.js";

import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";

function App() {
  return (
    <div className="App">
      <Chat />
    </div>
  );
}

export default App;

// import React, { useState } from 'react';
// import * as XLSX from 'xlsx';

// const App = () => {
//   const [data, setData] = useState([]);

//   const readFile = (e) => {
//     const file = e.target.files[0];
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       const binaryData = event.target.result;
//       const wb = XLSX.read(binaryData, { type: 'binary' });
//       const wsname = wb.SheetNames[0];
//       const ws = wb.Sheets[wsname];
//       const fileData = XLSX.utils.sheet_to_json(ws, { header: 1 });
//       setData(fileData);
//     };
//     reader.readAsBinaryString(file);
//   };

//   return (
//     <div>
//       <input type="file" onChange={readFile} />
//       <table>
//         {data.map((row, i) => (
//           <tr key={i}>
//             {row.map((cell, j) => (
//               <td key={j}>{cell}</td>
//             ))}
//           </tr>
//         ))}
//       </table>
//     </div>
//   );
// };

// export default App;
