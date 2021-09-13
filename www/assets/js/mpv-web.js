let globalCurrentLibPath
let playlistArray= []

window.addEventListener('load', loadWindow, false)

function loadWindow () {
  startWSSrv()
  Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {      
    if(/.*Btn$/.test(value.id)){     
     col[i].onclick = function (e) { controlBtn(e.target.id) }
    }
   })
  fillLibraryArray('\\Music')
}

