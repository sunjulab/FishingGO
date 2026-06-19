$(".pc .title button").click(function(){
  $(".pc").css("display","none");
	video.pause();
	$('#video')[0].pause()
	hls.stopLoad();
	hls.detachMedia();
	clearInterval(timeId);
	times = 30;
});
var infowindow = new kakao.maps.InfoWindow({zIndex:1});
var cctvMarkers = []
createCCTVMarkers(); 
function createCCTVMarkers() {
  $.ajax({
    url:"./assets/xml/cctv.xml",
    method:"GET",
    dataType: 'xml', // 문서 타입
    success:function(xml){
      var i=0;
      $(xml).find('item').each(function(){
        var kak = new kakao.maps.LatLng($(this).find("x").text(), $(this).find("y").text());
        var imageSize = new kakao.maps.Size(35, 45),
            imageOptions = { spriteOrigin: new kakao.maps.Point(0, 0),    spriteSize: new kakao.maps.Size(27, 35)  };     
        // 마커이미지와 마커를 생성합니다

        var markerImage = createMarkerImage("./images/sub/1_map_pin_1@2x.png", imageSize, imageOptions),    
            marker = createMarker(kak, markerImage),
            itemEl = getListItem("safety_cctv", $(this).find("num").text(), $(this).find("address").text(), $(this).find("url2").text(), $(this).find("url").text() ); 
        
        var text = $(this).find("num").text()+'<br/>'+$(this).find("address").text();
   
        var infowindow = new kakao.maps.InfoWindow({
            content: '<div style="width:200px;padding:6px;font-size:12px;">'+text+'</div>' 
        });
        kakao.maps.event.addListener(marker, 'mouseover', makeOverListener(map, marker, infowindow));
        kakao.maps.event.addListener(marker, 'mouseout', makeOutListener(infowindow));
        kakao.maps.event.addListener(marker, 'mousedown', makeClickListener($(this).find("url2").text(),$(this).find("address").text(),$(this).find("url").text()));

        itemEl.onclick =  function () {displayInfowindow(map,marker, text, kak, this)};
    
        cctvMarkers.push(marker);
		
      });
      setCCTVMarkers(map);
    }
  });
}
function setCCTVMarkers(map) {        
  for (var i = 0; i < cctvMarkers.length; i++) {  
    cctvMarkers[i].setMap(map);
  }
}

//지도 아이콘 클릭 //모바일과 구분
function makeClickListener(url,address,url1){
  return function() {

    $(".pc").css("display","block");
    $(".pc .video video").css({"background":"url(./images/sub/loading_01.gif)","background-size":"cover"});
    videoPlay(url,address);
  };
}
//리스트 클릭 //모바일과 구분
function displayInfowindow(map,marker, title, kak , e) {
  $('html').scrollTop(0);
  $(".sub_list li").removeClass("active");
  $(e).addClass("active");
  var content = '<div style="width:200px;padding:6px;font-size:12px;">' + title + '</div>';
  infowindow.setContent(content);
  infowindow.open(map, marker);
  var moveLatLon = new kakao.maps.LatLng(kak.Ma, kak.La);
  map.setCenter(moveLatLon);
  
  $(".pc").css("display","block");
  $(".pc .video video").css({"background":"url(./images/sub/loading_01.gif)","background-size":"cover"});
  videoPlay($(e).attr("data-url"),$(e).find("p").html());
}


//검색결과 항목을 Element로 반환하는 함수입니다
function getListItem( cname, text1, text2,url,url2) {
  var el = document.createElement('li'),
  itemStr = '<a href="javascript:;"><h2>'+text1+'</h2><p>'+text2+'</p><div></div></a>';           
  el.innerHTML = itemStr;
  el.className = cname;
  $(el).attr("data-url" ,url);
  $(el).attr("data-url2" ,url2);

  $(".cctv ul").append(el);
  return el;
}

//지도 중심
function setCenter(lat,lng) {            
    // 이동할 위도 경도 위치를 생성합니다 
    var moveLatLon = new kakao.maps.LatLng(lat, lng);
    
    // 지도 중심을 이동 시킵니다
    map.setCenter(moveLatLon);
}


// 마커이미지의 주소와, 크기, 옵션으로 마커 이미지를 생성하여 리턴하는 함수입니다
function createMarkerImage(src, size, options) {
    var markerImage = new kakao.maps.MarkerImage(src, size, options);
    return markerImage;            
}

// 좌표와 마커이미지를 받아 마커를 생성하여 리턴하는 함수입니다
function createMarker(position, image) {
    var marker = new kakao.maps.Marker({
        position: position,
        image: image
    });
    
    return marker;  
}   

var video;
var hls;
function videoPlay(url,address){
	timeId;
	clearInterval(timeId);
	times = 30;
	$(".close_time").html(30);
	timeId = setInterval(Timeover,1000);
	
	if(typeof hls != 'undefined'){
		video.pause();
		$('#video')[0].pause()
		hls.stopLoad();
		hls.detachMedia();
	}
  
  if($(window).width() <= 640){
     $(".pc").addClass("mobile");
  }else{
     $(".pc").removeClass("mobile");
  }
	
	if(times == 30){
		video = document.getElementById('video');
		$(".pc .title strong").html(address);
		hls = new Hls();
		var videoSrc = url;//'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
		if (Hls.isSupported()) {
			hls.loadSource(videoSrc);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, function () {
				video.muted = 'muted';
				video.autoplay = 'autoplay';
				video.playsinline = 'true';
				video.play();
			
			});
		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = videoSrc;
			video.addEventListener('loadedmetadata', function () {
				video.muted = 'muted';
				video.autoplay = 'autoplay';
				video.playsinline = 'true';
				video.play();
			
			});
		}
	}
}
var timeId;
var times = 30;
function Timeover(){
	$(".close_time").html(times);
	times--;
	if(times <= 0){
		clearInterval(timeId);
		times = 30;
	    $(".pc").css("display","none");
		video.pause();
		$('#video')[0].pause()
		hls.stopLoad();
		hls.detachMedia();
	}
}