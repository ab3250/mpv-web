/* variables */
const audioFilesRegEx = /(\.flac|\.m2ts|\.mp3|\.m4a|\.m3u)$/
/* startup */

function startWSSrv(){
  ws = new WebSocket("ws://localhost:8080/ws")
  console.log("initialized websocket")
  ws.onmessage = function(evt) {
    console.log(evt.data);
  
  }
  ws.onopen = function() {
    console.log("connected");
  }
  ws.onclose = function() {
    console.log("closed websocket");
  }
}

/* event handlers */

function upbutton(){
  fillLibraryArray(pathRemoveLast(globalCurrentLibPath))
}

function homebutton(){
  fillLibraryArray('\\Music')
}

/* library rendering */

function fillLibraryArray(path) {
  axios.get(path)
    .then (function (response) {
      // handle success
      globalCurrentLibPath = response.config.url
      console.log(pathRemoveLast(globalCurrentLibPath))
      document.getElementById('breadcrumbs').innerHTML = globalCurrentLibPath
  
      renderLibraryPage(response)      
    })
    .catch(function (error) {
      // handle error
      console.log("debug" + error)
    })
    .then(function () {
      // always executed
    })
  }

function renderLibraryPage(jsonObj){
  const displayList = jsonObj.data.filter(element=>element.type==="directory"||audioFilesRegEx.test(element.name))
  const library = document.getElementById('inner-library')
  while (library.hasChildNodes()) {  
    library.removeChild(library.firstChild)
  } 
  const ul = document.createElement("ul") 
  library.appendChild(ul)
  displayList.forEach(element => {
    const li=document.createElement("li")
    li.innerText=element.name
    li.style.listStyleImage=element.type==="directory"?"url('./assets/img/folder.png')":"url('./assets/img/969821.png')"
    ul.appendChild(li) 
    li.onclick=element.type==="directory"
      ?function () {fillLibraryArray(globalCurrentLibPath + '\\' + element.name)}
      :function () {element.path=globalCurrentLibPath; playlistArray.push(element);renderPlaylistPage(playlistArray)}
  })
}

function renderPlaylistPage(playlistArray){  
  const playlist = document.getElementById('inner-playlist')
  while (playlist.hasChildNodes()) {  
    playlist.removeChild(playlist.firstChild)
  } 
  const ul = document.createElement("ul")
  playlist.appendChild(ul)
  playlistArray.forEach(element => {
    const li=document.createElement("li")
    li.innerText=element.name
    li.style.listStyleImage="url('./assets/img/969821.png')"
    ul.appendChild(li) 
    li.onclick=function () {const audioElement = new Audio(element.path + '\\' + element.name)
                           // audioElement.play()
                           const regex = /\//g;
                           const str = (element.path + '\\' + element.name).replace(/\\/g,"\/")
                            ws.send("{\"type\": \"mm\",\"data\": \"" + str + "\"}")                            
                            }
  })
}

/* utilites */
function pathRemoveLast(path){
  return(path==='\\Music'?path:path.replace(/\\[^\\]+$/,""))
}
