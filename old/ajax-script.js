const $ = import('/assets/jquery.slim.js')
window.addEventListener('load', loadWindow, false)
// window.setInterval(reloadWindow, 3000)

function mode (btnID) {
  const data = JSON.stringify({ btnID: btnID })
  const xhttp = new XMLHttpRequest()
  const test = document.getElementById('iframe_id').contentWindow.location.href
  xhttp.ResponseType = 'json'
  xhttp.open('POST', test.substring(31, test.length) + 'B4FF2058', true)
  xhttp.onreadystatechange = function () {
  // In local files, status is 0 upon success in Mozilla Firefox
    if (xhttp.readyState === XMLHttpRequest.DONE) {
      var status = xhttp.status
      if (status === 0 || (status >= 200 && status < 400)) { // The request has been completed successfully
        var jsonResponse = JSON.parse(xhttp.responseText)
        switch (jsonResponse.btnID) {
          case 'pauseLed':
            // document.getElementById(btnID).innerHTML = jsonResponse.caption
            document.getElementById(jsonResponse.btnID).style.backgroundColor = jsonResponse.color
            break
          case 'modeBtn':
            document.getElementById('modedisplay').innerHTML = jsonResponse.caption
            break
          case 'shuffleLed':
            document.getElementById(jsonResponse.btnID).style.backgroundColor = jsonResponse.color
            break
          case 'refreshBtn':
            document.getElementById('pauseLed').style.backgroundColor = '#B0B0B0'
            document.getElementById('shuffleLed').style.backgroundColor = '#B0B0B0'
            break
          default:
            break
        }
      }
    } else {
      //  alert("error")// Oh no! There has been an error with the request!
    }
  }
  xhttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
  xhttp.send(data)
  return false // keep page from posting
}

function loadWindow () {
  Array.from(document.getElementsByTagName('button')).forEach(function (value, i, col) {
    col[i].onclick = function (e) { mode(e.target.id) }
  })

  mode('refreshBtn')
  // const doIt = bool(true)
  const source = new EventSource('/connect')
  source.onmessage = function (e) {
    // if (doIt.current) reloadWindow()
    // doIt.toggle()
    var jsonData = JSON.parse(e.data)
    const element = document.getElementById('files')
    element.innerHTML = '<li class="header"><span class="name">Name</span></li>'
    jsonData.forEach((item, index) => {
      element.innerHTML += '<li><span id="sp' + index + '" class="name">' + item.filename + '</span></li>'
      if (item.current) {
        document.getElementById('sp' + index).innerHTML += '*'
      }
    })
  }
  // source.onerror(() => { alert('error') })
  source.addEventListener('error', function (event) {
    switch (event.target.readyState) {
      case EventSource.CONNECTING:
        console.log('Reconnecting...')
        break
      case EventSource.CLOSED:
        console.log('Connection failed, will not reconnect')
        break
    }
  }, false)

  source.addEventListener('open', function (event) {
    console.log('Stream is open')
  }, false)
}
// eslint-disable-next-line no-unused-vars
function reloadWindow () {
  const evt = new Event('load')
  window.dispatchEvent(evt)
}
