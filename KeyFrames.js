var canvasDownloaded = new Array();

function KeyFramesPlugin(options) {
  const player = this;
  player.addEventListener(amp.eventName.loadeddata, function () {
        player.currentTime(100);
		//Start to download keyframes and buffer thumbnail imgs when windows is loading
		downloadKeyFramesURL(options.requestKeyframesUrl);
		InitializeAMPThumbnail(player, player.duration());
  });
}

function hideImages(player, e) {
	var seekBar = player.controlBar.progressControl.seekBar;
    var seekLeft = seekBar.el().getBoundingClientRect().left;
    var seekRight = seekBar.el().getBoundingClientRect().right;
	var seekTop = seekBar.el().getBoundingClientRect().top;
    var seekBottom = seekBar.el().getBoundingClientRect().bottom;
	
	document.getElementById("performance").events_textarea.value += "SeekBar left:" + seekLeft + " right:" + seekRight + " top:" +  seekTop + " bottom:" + seekBottom + "\n";
	
	document.getElementById("performance").events_textarea.value += "mouse:" + e.clientX + " " + e.clientY + "\n";
	// Chrome fires mouseout event aggresively, checking mouse position to counteract the false mouseout events
	if ((e.clientX <= seekLeft) || (e.clientX >= seekRight) || (e.clientY <= seekTop) || (e.clientY >= seekBottom)) {
		var imgSprite = document.getElementById("imgSprite");
		imgSprite.style.visibility = "hidden";
		var imgSpriteLeft = document.getElementById("imgSpriteLeft");
		imgSpriteLeft.style.visibility = "hidden";
		var imgSpriteLeftLeft = document.getElementById("imgSpriteLeftLeft");
		imgSpriteLeftLeft.style.visibility = "hidden";
		var imgSpriteRight = document.getElementById("imgSpriteRight");
        imgSpriteRight.style.visibility = "hidden";
		var imgSpriteRightRight = document.getElementById("imgSpriteRightRight");
        imgSpriteRightRight.style.visibility = "hidden";
		return true;
	}
	else {
		return false;
	}
}

function InitializeAMPThumbnail(player, videoLength) {
    var seekBar = player.controlBar.progressControl.seekBar.el();
    seekBar.addEventListener("mousemove", function (e) {
		displayStart = performance.now();
        var timeSeconds = GetTimeSeconds(e, player);
		
		var index = findKeyFrameBySeconds(timeSeconds, videoLength);
		if (canvasDownloaded[index]) {
			displayThumbnailAMP(index, false);
		}
		else {
		    document.getElementById("result").events_textarea.value += "request thumbnail :" + index + "\n";
			thumbnailRequest = index;
			fDraw = true;
		}
		
    });
	
    seekBar.addEventListener("mouseout", function (e) {
		hideImages(player, e);
    });
	
	
    var imgSprite = document.createElement("img");
    imgSprite.id = "imgSprite";
    imgSprite.style.position = "absolute";
	imgSprite.style.visibility = "hidden";
    seekBar.appendChild(imgSprite);
	
	// For Zoetrop experience: imgSpriteLeft imgSpriteLeftLeft imgSpriteRight imgSpriteRightRight
	var imgSpriteLeft = document.createElement("img");
    imgSpriteLeft.id = "imgSpriteLeft";
    imgSpriteLeft.style.position = "absolute";
	imgSpriteLeft.width = 100;
	imgSpriteLeft.height = 75;
	imgSpriteLeft.style.visibility = "hidden";
    seekBar.appendChild(imgSpriteLeft);
	
	var imgSpriteLeftLeft = document.createElement("img");
    imgSpriteLeftLeft.id = "imgSpriteLeftLeft";
    imgSpriteLeftLeft.style.position = "absolute";
	imgSpriteLeftLeft.width = 100;
	imgSpriteLeftLeft.height = 75;
	imgSpriteLeftLeft.style.visibility = "hidden";
    seekBar.appendChild(imgSpriteLeftLeft);
	
	var imgSpriteRight = document.createElement("img");
    imgSpriteRight.id = "imgSpriteRight";
    imgSpriteRight.style.position = "absolute";
	imgSpriteRight.width = 100;
	imgSpriteRight.height = 75;
	imgSpriteRight.style.visibility = "hidden";
    seekBar.appendChild(imgSpriteRight);
	
	var imgSpriteRightRight = document.createElement("img");
    imgSpriteRightRight.id = "imgSpriteRightRight";
    imgSpriteRightRight.style.position = "absolute";
	imgSpriteRightRight.width = 100;
	imgSpriteRightRight.height = 75;
	imgSpriteRightRight.style.visibility = "hidden";
    seekBar.appendChild(imgSpriteRightRight);
	
	var centerHight = -1 * (player.controlBar.el().offsetHeight + 250) + "px";
	imgSpriteLeft.style.top = centerHight;
	imgSpriteLeftLeft.style.top = centerHight;
	imgSpriteRight.style.top = centerHight;
	imgSpriteRightRight.style.top = centerHight;
}


function GetTimeSeconds(e, player) {
    var seekBar = player.controlBar.progressControl.seekBar;
    var seekLeft = seekBar.el().getBoundingClientRect().left;
    var seekWidth = seekBar.width();
    var mouseOffset = (e.pageX - seekLeft) / seekWidth;
    var timeSeconds = player.duration() * mouseOffset;
    SetImageLeftAMP(player, seekWidth, mouseOffset);
    return timeSeconds;
}


function SetImageLeftAMP(player, seekWidth, mouseOffset) {
    var imgSprite = document.getElementById("imgSprite");
    var imgLeft = (seekWidth * mouseOffset) - (imgSprite.width / 2);
    if (imgLeft < 0) {
        imgLeft = 0;
    } else if (imgLeft + imgSprite.width > seekWidth) {
        imgLeft = seekWidth - imgSprite.width;  
    }
    imgSprite.style.left = imgLeft + "px";
	
	imgSprite.style.top = -1 * (player.controlBar.el().offsetHeight + 150) + "px";
}

var thumbnailRequest = 0;	// handle mousemove request
var displayStart;			// measure rendering performance
var displayEnd;				// measure rendering performance
function displayThumbnailAMP(index, fDisplayAll) {
	var imgSprite = document.getElementById("imgSprite");
	imgSprite.src = m_images[index].src;
	imgSprite.style.visibility = "visible";
	
	if (fDisplayAll) {
		var imgSpriteLeft = document.getElementById("imgSpriteLeft");
		var imgSpriteLeftLeft = document.getElementById("imgSpriteLeftLeft");
		var imgSpriteRight = document.getElementById("imgSpriteRight");
		var imgSpriteRightRight = document.getElementById("imgSpriteRightRight");

		if ((index -1 > 0) && (canvasDownloaded[index-1])) {
			imgSpriteLeft.src = m_images[index-1].src;
			imgSpriteLeft.style.visibility = "visible";
		}
		if ((index -2 > 0) && (canvasDownloaded[index-2])) {
			imgSpriteLeftLeft.src = m_images[index-2].src;
			imgSpriteLeftLeft.style.visibility = "visible";
		}
		if ((index+1 < m_images.length) && (canvasDownloaded[index+1])) {
			imgSpriteRight.src = m_images[index+1].src;
			imgSpriteRight.style.visibility = "visible";
		}
		if ((index+2 < m_images.length) && (canvasDownloaded[index+2])) {
			imgSpriteRightRight.src = m_images[index+2].src;
			imgSpriteRightRight.style.visibility = "visible";
		}
	}
	
	// log information
	displayEnd = performance.now();
	document.getElementById("result").events_textarea.value += "draw thumbnail :" + index + "\n";
	document.getElementById("performance").events_textarea.value = "";
	document.getElementById("performance").events_textarea.value += "Draw Index:" + index + "\n";
	document.getElementById("performance").events_textarea.value += "Delay:" + (displayEnd - displayStart) + "\n";
}

var videoPlayer; //hidden video tag, for drawing thumbnail
var vidSourceBuffer;
var mediaSource;
var subDataStrLen = 0;

var m_images = new Array();
var m_frameTime = new Array();
var currentIndex = 0;
function saveThumbnail() {
	playbackEnd = performance.now();
	document.getElementById("result").events_textarea.value += "PlaybackTime:" + (playbackEnd - playbackStart) + "\n";
	
	var tmpCanvas = document.createElement("canvas");
	tmpCanvas.width = 200;
	tmpCanvas.height = 150;
	tmpCanvas.getContext("2d").drawImage(videoPlayer, 0, 0, 200, 150);
	
	m_frameTime[currentIndex] = frameStart;
	m_images[currentIndex] = new Image();
	m_images[currentIndex].src = tmpCanvas.toDataURL();
	canvasDownloaded[currentIndex] = true;
	document.getElementById("result").events_textarea.value += "save canvas: " + currentIndex + " frame time: " + frameStart + "\n";

	if ((fDraw) && (currentIndex == thumbnailRequest)) {
		fDraw = false;
		displayThumbnailAMP(currentIndex, false);
	}
	if (!fFinished) {
		checkAndDownloadThumbnails();
	}
}

function findKeyFrameBySeconds(timeSeconds, videoLength) {
	var index = 0;
	if (videoLength != 0) {
		index = parseInt(subDataStrLen * (timeSeconds / videoLength), 10);
	}
	return index;
}

function downloadKeyFramesURL(requestKeyframesUrl) {
	videoPlayer =  document.createElement("video");
	videoPlayer.width = 800;
	videoPlayer.height = 600;
	videoPlayer.style.display = "none";
	downloadResourceXHR(requestKeyframesUrl, downloadKeyFrames);
}

var mimeType="video/mp4; codecs=\"";
function downloadKeyFrames(type, data) {
	// Extract quality level, codec information
    var res = data.split("#EXT-X-I-FRAME-STREAM-INF");
	var quality = 10000000;
	var hlsKeyframeURL = "";
	var codec = "";
	for (var i = 1; i < res.length; i++) {
		var idx1 = res[i].search("QualityLevels");
		var idx2 = res[i].search("/Manifest");
		var tmpQuality = parseInt(res[i].substr(idx1+14, idx2-idx1-14));
		if (tmpQuality < quality) {
			quality = tmpQuality;
			var idx3 = res[i].search("URI=");
		    var idx4 = res[i].search("keyframes");
			hlsKeyframeURL = res[i].substr(idx3+5, idx4+5-idx3);
			var idx5 = res[i].search("CODECS=");
			codec = res[i].substr(idx5+8, idx3-idx5-10);
		}
	}
	mimeType += codec + "\"";
	var srcURL = document.getElementById("sourceUrl").value;
	var idx = srcURL.search(".ism/manifest");
	var downloadKeyframeURL = srcURL.substr(0,idx+5) + hlsKeyframeURL;
	var idx = downloadKeyframeURL.search("video,format=m3u8-aapl,type=keyframes");
	oriHttp = downloadKeyframeURL.substr(0,idx-9) +  "KeyFrames";
	downloadResourceXHR(downloadKeyframeURL, parseKeyFrames);
}

var totalStartTime;
var totalEndTime;
// downloads a media resource
function downloadResourceXHR(url,callback) {
    totalStartTime = performance.now();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.response.type, xhr.response);
            } else {
                callback(null, null);
            }
        }
    }
    xhr.send();

    return xhr;
}

var initFrameData = new Array();
var keyFrameUrl = new Array();
function parseKeyFrames(type, data) {
	var dataStr = data.toString();
	var strlen = dataStr.length;
	var res = dataStr.split("KeyFrames");
	
	document.getElementById("result").events_textarea.value += "Total Key Frames :" + res.length + "\n";
   
	//download init frame
	var initUrl = oriHttp.concat("(video=i,format=mpd-time-csf)");
	downloadSegment(0, initUrl, function(data) {
		initFrameData.push(data);
	});
   
	var step = 1; 
	if (res.length > 100) {
		step = parseInt(res.length / 100 );
		subDataStrLen = 100;
		document.getElementById("result").events_textarea.value += "download Key Frames :" + subDataStrLen + " step:" + step + "\n";
	}
	else {
		subDataStrLen = res.length;
	}
   
	for (var i = 0; i < subDataStrLen; i++) {
		canvasDownloaded[i] = false;
	}
 
	var j = 1;
	for (var i = 0; (i < subDataStrLen) && ( j < res.length); i++) {
		var idx = res[j].search("format");
		keyFrameUrl[i] = oriHttp.concat(res[j].substr(0, idx+7));
		keyFrameUrl[i] = keyFrameUrl[i].concat("mpd-time-csf)");
		j += step;
	}
   
	checkAndDownloadThumbnails();
}

//CheckAndDownloadThumbnails() will be called to download next frame, until all frames are downloaded
function setupPlayerwithKeyFrame(index) {
	totalStartTime = performance.now();
	downloadSegment(index, keyFrameUrl[index], function(data) {
		setupPlayer(index);
	});
}

var fFinished = false;
var fDraw = false;
function checkAndDownloadThumbnails() {
	if (fFinished == false){
		//Check whether there is request for certain iFrame index
		if (fDraw) {
			currentIndex = thumbnailRequest;
			if (canvasDownloaded[currentIndex]) {
				displayThumbnailAMP(currentIndex, false);
				fDraw = false;
				//Download next frame
				checkAndDownloadThumbnails();
			}
			else {
				setupPlayerwithKeyFrame(currentIndex);
			}
		}
		else {
			//Continue to download next frame
			var i = 0;
			while ((i < canvasDownloaded.length) && (canvasDownloaded[i])) {
				i++;
			}
			if (i == canvasDownloaded.length) {
				fFinished = true;
				document.getElementById("result").events_textarea.value += "finish downloading\n";
			}
			else {
				currentIndex = i;
				setupPlayerwithKeyFrame(currentIndex);
			}
		}
	}
}

//Main entrypoint to create the MSE video player
var playbackStart;
var playbackEnd;
function setupPlayer(index) {
	document.getElementById("result").events_textarea.value += "setupPlayer("+ index + ")\n";
	playbackStart = performance.now();

	// Create MSE object
	mediaSource = new MediaSource();

	// Register sourceopen event handler in order to 
	// add source buffers to MSE after it has been attached to
	// the video element.
	mediaSource.addEventListener("sourceopen", function() {
    // Register timeupdate event handler to save Thumbnail img
	videoPlayer.addEventListener("ended", saveThumbnail, false);
    if (mediaSource.sourceBuffers.length == 0) {
		// Add video source buffers
		vidSourceBuffer = createSourceBuffer(mediaSource, index);
		// Download INIT segments and initial MEDIA segments
		updateSourceBuffers(mediaSource, vidSourceBuffer, index);
		}
	}, false);

	mediaSource.addEventListener("sourceclose", function() {
	videoPlayer.removeEventListener("timeupdate", updateSourceBuffers, false);
	}, false);

	// Attach the MSE object to the video element
	videoPlayer.src = URL.createObjectURL(mediaSource, {oneTimeOnly:true});
	videoPlayer.play();
}

// helper to add a source buffer and initialize some state
function createSourceBuffer(mediaSource, index) {
	if (mediaSource.readyState !== "open") { return; }   //if mediaSource.readyState !== "open", mediaSource.addSourceBuffer will fail
	var sourceBuffer = mediaSource.addSourceBuffer(mimeType);

	// Store additional state as custom properties on the source buffers
	sourceBuffer.needsInitSegment = true;
	sourceBuffer.lastInitSegmentUrl = "";
	sourceBuffer.nextSegment = 0;
	sourceBuffer.eos = false;
	sourceBuffer.isVideo = true;
	sourceBuffer.appendingData = false;

	// Register updateend event handler to know when the append or remove operation has completed
    sourceBuffer.addEventListener("updateend", function() {
		sourceBuffer.appendingData = false;
		updateSourceBuffers(mediaSource, sourceBuffer, index);
	});
  
	return sourceBuffer;
}

// function called periodically to update the source buffers by appending more segments
function updateSourceBuffers(mediaSource, vidSourceBuffer, index) {

	appendInitSegment(vidSourceBuffer);
    appendNextMediaSegment(vidSourceBuffer, index);

	// Call mediaSource.endOfStream() once all segments have been appended
	if (!!vidSourceBuffer && !vidSourceBuffer.updating && mediaSource.readyState === "open") {
		mediaSource.endOfStream();
		getBufferLevel(vidSourceBuffer);
	}
}

// appends an INIT segment if necessary
function appendInitSegment(sourceBuffer) {
	// no-op if already appended an INIT segment or
	// if we are still processing an append operation
	if (!sourceBuffer || !sourceBuffer.needsInitSegment || sourceBuffer.appendingData) {
		return;
	}

	// Download and append segment
	sourceBuffer.appendingData = true;
	sourceBuffer.appendBuffer(initFrameData[0]);
	sourceBuffer.needsInitSegment = false;
}

var keyFrameData;
// appends the next MEDIA segment if necessary
function appendNextMediaSegment(sourceBuffer, index) {
	// no-op if we are still processing an append operation
	// or if we have more than 4 seconds of data already buffered up
	if (!sourceBuffer || sourceBuffer.appendingData){
		return;
	}

	// Check if there are no more segments to download
	if (sourceBuffer.eos == true) {
		return;
	}

	sourceBuffer.appendingData = true;
	sourceBuffer.appendBuffer(keyFrameData);
	sourceBuffer.eos = true;
}

// downloads a segment
function downloadSegment(index, url, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.responseType = "arraybuffer";

	// prevent caching downloaded data to disk
	xhr.msCaching = "disabled";
  
	xhr.onreadystatechange = function() {
		if (xhr.readyState === 4) {
		if (xhr.status === 200) {
			document.getElementById("result").events_textarea.value +=  url + "\n";
			recordSegmentDownloadRate();
			keyFrameData = xhr.response;
			callback(xhr.response);
		} else {
			callback(null);
		}
		}
	}
	xhr.send();

	return xhr;
}

// helper to record the time taken to download a segment
function recordSegmentDownloadRate() {
	totalEndTime = performance.now();
	var totalTime = totalEndTime - totalStartTime;
	document.getElementById("result").events_textarea.value += "TotalTime:" + totalTime + "\n";
}

// returns the amount of time buffered 
// also set the video position to buffer start time
var frameStart;
function getBufferLevel(sourceBuffer) {
	var bufferLevel = 0;

	for (var i = 0; i < sourceBuffer.buffered.length; i++) {
		frameStart = sourceBuffer.buffered.start(i);
		var end = sourceBuffer.buffered.end(i);
  
		videoPlayer.currentTime = frameStart;

		bufferLevel = end - frameStart;
	}

	return bufferLevel;
}