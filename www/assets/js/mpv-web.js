let globalCurrentLibPath
let playlistArray= []

window.addEventListener('load', loadWindow, false)

function controlBtn(data){
  ws.send("{\"type\": \"cmd\",\"data\": \"" + data+ "\"}")  
}






function loadWindow () {
  startWSSrv()
  document.getElementById('upbutton').onclick = function () { upbutton() }
  document.getElementById('homebutton').onclick = function () { homebutton() }
  Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {      
    if(/.*Btn$/.test(value.id)){     
     col[i].onclick = function (e) { controlBtn(e.target.id) }
    }
   })
  
  //Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {
  //  col[i].onclick = function (e) { mode(e.target.id) }
  // })
  fillLibraryArray('\\Music')
// renderPlaylistPage(playlistArray)
}

