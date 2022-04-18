<script>
	window.onload = function() {
		inputChat.onkeydown = function (chanter) {
    		if (chanter.keyCode == 13 && inputChat.value !== "") {
    		    socket.emit("message", { "message": inputChat.value, "sender": nick });
    		    inputChat.value = "";
    		}
		};
	}
</script>

<div id="chat" class="box">
	<div id="messages">
		this is chat!<br>
		<strong>macimas: </strong>hello<br>
		<strong>macimas: </strong>S8F RG8R UHV URH I UHREGUHRI EGRUIGH RUGIH ERUEIH RIBHEH UIFFHI FJH DJH G RDUH  EUGHUIREH UIGRH UHFD SAAAAAAAAAAAAA
	</div>
	<input id="inputChat">
</div>