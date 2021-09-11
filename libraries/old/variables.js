/* eslint-disable */
//  variables ********************************************************
var socketFile = '/tmp/mpvsocket'
var cmdString =   [
                    ' --no-terminal',          //prevents cache overrun for messages
                    //' --no-cache',
                    ' --idle',
                    //' --no-demuxer-thread',
                    //' --no-config',
                    ' --input-ipc-server=' + socketFile
                  ]
module.exports = {
		 acceptedFiles : ['/*.flac','/*.mp3','/*.m2ts','/*.m4a', '/*.m3u'],
		 musicLibPath : "/media/ab/nas/Multimedia/Music",
		 excludeRegExp : /txt|doc|md5|ffp|dsf|jpg|tif|cue/,
		 audioFilesRegExp : /(\.flac|\.m2ts|\.mp3|\.m4a|\.m3u)$/,
     socketFile,
     cmdString,
     pauseStr :   '{"btnID":"pauseLed","color":"#cc3232"}',
     playStr :    '{"btnID":"pauseLed","color":"#B0B0B0"}',
     fwdStr :     '{"btnID":"forwardBtn"}',
     backStr :    '{"btnID":"backBtn"}',
     mode1Str :   '{"btnID":"modeBtn","caption" : "Append"}',
     mode2Str :   '{"btnID":"modeBtn","caption" : "Replace"}',
     randomStr :  '{"btnID":"shuffleLed","color":"#2dc937"}',
     orderedStr : '{"btnID":"shuffleLed","color":"#B0B0B0"}',
     playAllStr : '{"btnID":"playAllBtn"}',
     refreshStr : '{"btnID":"refreshBtn"}'
		 }
     