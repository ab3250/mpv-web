let globalCurrentLibPath
let playlistArray= []

window.addEventListener('load', loadWindow, false)








function loadWindow () {
  startWSSrv()
  document.getElementById('upbtn').onclick = function () { upbtn() }
  document.getElementById('homebtn').onclick = function () { homebtn() }
  //Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {
  //  col[i].onclick = function (e) { mode(e.target.id) }
  // })
  fillLibraryArray('\\Music')
// renderPlaylistPage(playlistArray)
}

