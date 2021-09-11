let globalCurrentLibPath
let playlistArray= []
window.addEventListener('load', loadWindow, false)

const audioFilesRegEx = /(\.flac|\.m2ts|\.mp3|\.m4a|\.m3u)$/

function pathRemoveLast(path){
  return(path==='\\Music'?path:path.replace(/\\[^\\]+$/,""))
}

function upbtn(){
  fillLibraryArray(pathRemoveLast(globalCurrentLibPath))
}

function homebtn(){
  fillLibraryArray('\\Music')
}


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
                            audioElement.play()
                            }
  })
}

  function loadWindow () {
    document.getElementById('upbtn').onclick = function () { upbtn() }
    document.getElementById('homebtn').onclick = function () { homebtn() }
    //Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {
    //  col[i].onclick = function (e) { mode(e.target.id) }
   // })
   fillLibraryArray('\\Music')
  // renderPlaylistPage(playlistArray)
  }

