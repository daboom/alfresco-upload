//at click on browser action it opens up a new tab
/* 
//new tab
chrome.browserAction.onClicked.addListener(function(activeTab){
	var newURL = "pages/upload.html";
	chrome.tabs.create({ url: newURL });
});
*/

//on DOM content loaded
$(function() {
	//ADD LISTENERS
	
	//Chrome listeners
	chrome.browserAction.onClicked.addListener(function() { //apre pagina di popup
		var w = 540;
		var h = 640;
		var left = (screen.width/2) - (w/2);
		var top = (screen.height/2) - ( h/2);
		chrome.windows.create(
			{'url': 'pages/upload.html', 'type': 'popup', 'width': w, 'height': h, 'left': left, 'top': top}, 
			function(window) {
				console.log("[main.chrome.browserAction.onClicked] pagina upload.html aperta")
			});
	});	
	/* Listen for messages from pages */
	chrome.runtime.onMessage.addListener(function (msg) {
		if (msg.action === "import-settings") {
			console.log("[main.#chrome.runtime.onMessage] catchato il messaggio " + msg.action);
		}
		if (msg.msg === "file_input") {
			console.log("[main.#chrome.runtime.onMessage] catchato il messaggio " + msg.msg);
		}
	});
	
	$("#export-icon").click(function (e) {
		console.log("[main.#export-icon.click] esporto dati su file");
		exportAll(function(result) {
			if (result === "ok") {
				console.log("[main.#export-icon.click] export ok");
				//showMessage("Dati esportati correttamente", GREEN_COLOR);
				showMessage(chrome.i18n.getMessage("msg_export_on_file"), GREEN_COLOR);
			}
			else {
				console.log("[main.#export-icon.click] export KO: " + result);
				//showMessage("Errore nell'export dei dati su file: " + result, RED_COLOR);
				showMessage(chrome.i18n.getMessage("msg_error_export_on_file") + ": "  + result, RED_COLOR);
			}
		});
	});
	
	$("#export-icon").attr("title", chrome.i18n.getMessage("html_export_title"));
	$("#import-icon").attr("title", chrome.i18n.getMessage("html_import_title"));
	
	$("#filedata").on("dragenter", function (e) {
		e.stopPropagation();
		e.preventDefault();
		$(this).css("border", "3px solid #0B85A1");
	});
	
	$("#filedata").change(function (e) {
		$("#filedata").css("border", "3px dotted #0B85A1");
		e.preventDefault();
		var files = event.target.files || event.originalEvent.dataTransfer.files;
		if (!isUndefined(files) && !isUndefined(files[0])) {
			$("#upload-icon").removeClass("icon-not-clickable"); //permetto di inviare visto che c'� un file caricato
			//Implemented multiple files selection, so commented these messages.
			//console.log("[main.#filedata.change] Pronto a spedire '" + files[0].name + "'");
			//showMessage("Pronto a spedire '" + files[0].name + "'", GREEN_COLOR);
			//showMessage(chrome.i18n.getMessage("msg_ready_to_send_file") + " '" + files[0].name + "'", GREEN_COLOR);
			
			//Show all selected file information
			var allFileNamesAndSize = "";
			for (var each = 0, f; f = files[each]; each++) {
				if (each > 0) {
					allFileNamesAndSize = allFileNamesAndSize + ",";
				}
				allFileNamesAndSize = allFileNamesAndSize + " " +f.name;
			}
			console.log("[main.#filedata.change] Pronto a spedire '" + allFileNamesAndSize + "'");
			showMessage(chrome.i18n.getMessage("msg_ready_to_send_files") + " '" + allFileNamesAndSize + "'", GREEN_COLOR);
		}
	});

	//gestione dei colori delle icone
	$(".icon").hover( function(e) {
		$(this).toggleClass("icon icon-highlited");
		$(this).removeClass(clGreen); 
	}).mousedown(function(e) {
		$(this).toggleClass(clGreen);
	}).mouseup( function(e) {
		$(this).toggleClass(clGreen); 
	});

	$("#overwrite").change(function (e) { 
		$(this).val($(this).is(":checked"));
		console.log("[main.#overwrite.change] (#overwrite).val() = " + $("#overwrite").val());
	});
		
	//salva profilo
	$("#save-icon").click(function(e) {
		if (!$("#actual-profile").val().trim()) { //se non c'� il nome profilo (ha lunghezza 0)
			//showMessage("Dai un nome al profilo prima di salvarlo!", RED_COLOR);
			showMessage(chrome.i18n.getMessage("msg_error_naming_profile") + "!", RED_COLOR);
		}
		else {
			//preparo dati da salvare
			var data = {
				profilename: $("#actual-profile").val(),
				alfroot: $("#alfroot").val(),
				username: $("#username").val(),
				password: $("#password").val(),
				siteid: $("#siteid").val(),
				uploaddirectory: $("#uploaddirectory").val(),
				overwrite: $("#overwrite").val()
			};
			var id = data.profilename;
			
			//salva profilo su storage (vedi store-manager.js)
			saveProfile(data, function(result) {			
				if (result == "ok") {
					//showMessage("Profilo '" + id + "' salvato con successo", GREEN_COLOR);
					showMessage(chrome.i18n.getMessage("msg_save_profile", id), GREEN_COLOR);
					
					//aggiorno lista profili su pagina solo se il profilo non � gi� elencato
					var exists = false;
					$("#select-profile option").each(function(option) {
						//console.log("[main] this.value = " + $(this).attr("value"));
						if ($(this).attr("value") == id) {
							exists = true;
						}
					});
					if (!exists) {
						refreshProfilesList(function(result) {
							//aggiorno tendina su pagina
							console.log("[main.#save-icon.click] tendina su pagina aggiornata con aggiunto: " + id);
							
							//$("#select-profile option:selected").text(id); //seleziono profilo appena salvato
						});
					}
					else {
						console.log("[main.#save-icon.click] il profilo '" + id + "' esiste in tendina, non lo aggiungo");
						//$("#select-profile option:selected").text(id); //seleziono profilo appena salvato
					}
				}
				else {
					//showMessage("Errore nel salvataggio del profilo  '" + id + "': " + result, RED_COLOR);
					showMessage(chrome.i18n.getMessage("msg_error_save_profile", [id, result]), RED_COLOR);
				}						
			});			
		}
	});

	//cancella profilo
	$("#trash-icon").click(function(e) {
		//var id = $("#actual-profile").val().trim();
		var id = $("#select-profile option:selected").text().trim();
		if (id.length > 0) {
			console.log("[main.#trash-icon.click] elimino profilo '" + id + "'");
			
			//elimino profilo su storage (vedi store-manager.js)
			deleteProfile(id, function(result) {
				console.log("[main.#trash-icon.click] elimina profilo result = " + result);
				if (result === "ok") {
					//showMessage("Profilo '" + id + "' rimosso con successo", GREEN_COLOR);
					showMessage(chrome.i18n.getMessage("msg_delete_profile", id), GREEN_COLOR);
					refreshProfilesList(); //aggiorno lista profili su tendina
				}
				else if (result === "ne") {
					//showMessage("Il profilo '" + id + "' non esiste, non posso eliminarlo", RED_COLOR);
					showMessage(chrome.i18n.getMessage("msg_error_delete_profile_not_exist", id), RED_COLOR);
				}
				else {
					//showMessage("Errore nella cancellazione del profilo '" + id + "': " + result, RED_COLOR);
					showMessage(chrome.i18n.getMessage("msg_error_delete_profile", [id, result]), RED_COLOR);
				}
			});
		}
	});
	
	//cambia dati quando cambia il profilo scelto
	$("#select-profile").change(function(e) {
		$("#actual-profile").val($("#select-profile option:selected").text());
		var id = $("#actual-profile").val();
		if (id.trim().length == 0) {
			return;
		}
		console.log("[main.#select-profile.change] recupero del profilo: '" + id + "'");
		getProfile(id, function(result) {
			if (typeof result === 'string' ) {
				//errore
				console.log("[main#select-profile.change] errore nel recupero del profilo: '" + id + "'");
				showMessage(chrome.i18n.getMessage("msg_error_load_profile", [id, result]), RED_COLOR);
				//showMessage("Errore nel recupero del profilo: '" + id + "'", RED_COLOR);
			}
			else if (!$.isEmptyObject(result)) {
				setUploadData(result);
				//showMessage("Caricato profilo '" + id + "'", GREEN_COLOR);
				showMessage(chrome.i18n.getMessage("msg_load_profile", id), GREEN_COLOR);
				console.log("[main.#select-profile.change] dati upload in form aggiornati");
			}
			else {
				//showMessage("Il profilo '" + id + "' non esiste, mi dispiace", RED_COLOR);
				showMessage(chrome.i18n.getMessage("msg_error_load_profile_not_existent", id), RED_COLOR);
				console.log("[main.#select-profile.change] profilo '" + id + "' inesistente o vuoto, non carico dati di upload su form");
			}
		});
		
	});	
	
	//apro popup
	$(".open-popup-link").magnificPopup({
		type: "inline",
		midClick: true,		
		callbacks: {
			elementParse: function(item) {
				// Function will fire for each target element "item.el" is a target DOM element (if present)
				// "item.src" is a source that you may modify
				
				//pulisco area di output e file caricato
				$("#import-status-message").empty();
				$("#filedata-import").val("");
			}
		}
	});	
	
	//carica su Alfresco
	$("#upload-icon").click(upload); //submit button upload to Alfresco
	
	//SOLO PER TEST!!!!!
	$("#clear-db").click(clearDb); //clear db
	$("#mostra").click(getAll); //mostra tutto
	//$("#save-prof").click(updateProfilesList); //save profiles
	//$("#mbusati").click(getBytesInUse);
	//$("#showpath").click(saveFile);
	///////////////////////
	
	//carica la lista di profili esistenti in pagina
	refreshProfilesList();
	
	//carica ultimi dati di upload utilizzati(se esistenti)
	loadLastUsedUploadData();

});

////vars
var data = new FormData(); //used to store data to upload in Alfresco
var resp; //stores ajax response
var GREEN_COLOR = "green";
var RED_COLOR = "red";
var SUCCESS = 0;
var FAILURE = 1;
var PERCENT_15 = 0.15; //login percentage
var PERCENT_75 = 0.75; //alfresco file upload
var clHeartEmpty = "icon-heart-empty";
var clHeart = "icon-heart";
var	clGreen = "icon-green";
//var alfrescoRoot = "http://intra.e-projectsrl.net/alfresco"; //ep alfresco
var alfrescoRoot = "http://localhost:8080/alfresco";
var actualProfile;

//usata a scopo di test
function checkFormParam() {
	var report = "";
	$("input").each(function(input) {
		console.log("[main]" + $( this ).attr("id") + ": " + $( this ).val() );
		report += ("[main]" + $( this ).attr("id") + ": " + $( this ).val() + "<br>");
	});
	$("status-message").html(report);
}

/**
* Login e carico il file sulla repo Alfresco 
*/
function upload() {
	$("#status-message").empty(); //pulisco area messaggi

	var missingParameters = false;
	$("#upload-form-wrapper input").each(function (index) {
		if (isEmptyString( $(this).val() )) {
			missingParameters = true;
			return;
		}
	});
	if (missingParameters) {
		console.log("[main.upload] mancano dati per l'upload, quindi non lo eseguo");
		//showMessage("Compila tutti i dati del form o non posso caricare il file", RED_COLOR);
		showMessage(chrome.i18n.getMessage("msg_error_missing_upload_params"), RED_COLOR);
		return;
	}
	
	$("#upload-icon").addClass("icon-not-clickable"); //rendo il pulsante di upload non cliccabile
	$("#overwrite").val($("#overwrite").is(":checked")); //setto il valore di overwrite (true o false)
	
	//salvo dati di upload per la prossima volta
	var toSave = {
		alfroot: $("#alfroot").val(),
		siteid: $("#siteid").val(),
		username: $("#username").val(),
		password: $("#password").val(),
		uploaddirectory: $("#uploaddirectory").val(),
		overwrite: $("#overwrite").val()
	}
	
	saveLastUsedUploadData(toSave, function(result) {
		if (result === "ok") {
			console.log("[main.upload] dati di upload salvati per la prossima volta");
		}
		else {
			console.log("[main.upload] errore nel salvataggio dei metadati di upload: " + result);
			//showMessage("Errore nel salvataggio dei metadati di upload: " + result, RED_COLOR);
			showMessage(chrome.i18n.getMessage("msg_error_saving_upload_params", result), RED_COLOR);
		}
	});
	
	//preparo i dati per l'upload prendendoli dal form in pagina
	var usr = {
		"username": $("#username").val(), 
		"password": $("#password").val()
	};
	//console.log("[main.upload] login via POST su: " + $("#alfroot").val().trim() + "/service/api/login/"+ JSON.stringify(usr));
	console.log("[main.upload] login via POST su: " + $("#alfroot").val().trim() + "/service/api/login/["+ JSON.stringify(usr.username) + "]");
	
	//chiamata ajax per gestire il login-ticket
	$.ajax({
		type: "POST",
		//url: alfrescoRoot + "/service/api/login",
		url: $("#alfroot").val().trim() + "/service/api/login",
		contentType: "application/json; charset=utf-8", //questo � fondamentale
		data: JSON.stringify(usr),
		
		//prima
		beforeSend: function() {
			//disabilito la possibilit� di modificare i dati di upload
			$("#upload-form-wrapper input").each(function (index) {
				$(this).prop("readonly", true);
			});
			showMessage("Login...", GREEN_COLOR);
			
			NProgress.start();
		},
		success: function (json) {
			NProgress.inc(PERCENT_15); //after login
			console.log("[main.upload] login-resp = " + JSON.stringify(json));
			resp = JSON.parse(JSON.stringify(json));
			showMessage("LOGIN OK!", GREEN_COLOR);
			var ticket = resp.data.ticket; //salvo il ticket per effettuare il caricamento
			
			//ajax per upload del form con il file
			var formData = new FormData(document.getElementById("upload-form"));
			var filesLength = document.getElementById('filedata').files.length;
			for (var each = 0; each < filesLength; each++) {
				var eachFile = document.getElementById('filedata').files[each];
				formData.set("filedata", eachFile);
				console.log("##############################File data############################## [Start]");
				console.log(formData.get('filedata')); //Print and check if the file data was really set
				console.log("##############################File data############################## [End]");
				alfrescoUploadMulti(ticket, formData);
			}

		},	
		error: function (json) {
			console.log("[main.upload] login-resp = " + JSON.stringify(json));
			NProgress.done();
			manageAjaxError(json);
			
			$("#upload-icon").removeClass("icon-not-clickable"); //riabilito il click sul pulsante di upload
			
			//riabilito la possibilit� di modificare i dati di upload
			$("#upload-form-wrapper input").each(function (index) {
				$(this).prop("readonly", false);
			});
		}
	});
}

//To upload multiple files
function alfrescoUploadMulti(ticket, formData) {
	console.log("[main.alfrescoUploadMulti] upload multiple...");
	$("#uploaddirectory").val('/' + $("#uploaddirectory").val() + '/');
	$.ajax({
		type: "POST",
		url: $("#alfroot").val().trim() + "/service/api/upload?alf_ticket=" + ticket,
		cache: false,
		contentType: false, 
		processData: false,
		dataType: "json",
		//async: false,
		data: formData,
				
		beforeSend: function() {
			showMessage("Upload...", GREEN_COLOR);
			console.log("[main.alfrescoUploadMulti] uploading...");
			var uploadDir = $("#uploaddirectory").val();
			$("#uploaddirectory").val(uploadDir.substring(1, uploadDir.length - 1));
		},
		
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(e) {
				if (e.lengthComputable) {
					var percentComplete = e.loaded / e.total;
					percentComplete = PERCENT_15 + percentComplete * PERCENT_75;
					NProgress.set(percentComplete);
				}
			}, false);
			return xhr;
		},
		
		success: function (json) {   
			console.log("[main.alfrescoUploadMulti] upload-success");
			showMessage("UPLOAD OK", GREEN_COLOR);		
			console.log("[main.alfrescoUploadMulti] upload-response: " + JSON.stringify(json));
		},
		
		error: function (json) {
			manageAjaxError(json);
		},
		
		complete: function () {
			console.log("[main.alfrescoUploadMulti] upload-complete");
			$("#upload-icon").removeClass("icon-not-clickable"); 
			$("#upload-form-wrapper input").each(function (index) {
				$(this).prop("readonly", false);
			});
			NProgress.done();
		}
	});
}

//To upload single file
//Deprecated. Use 'alfrescoUploadMulti' method
function alfrescoUpload(ticket) {
	$("#uploaddirectory").val('/' + $("#uploaddirectory").val() + '/'); //metto le barre altrimenti ALfresco non riconosce la folder (vedi upload.post.js)
	var formData = new FormData(document.getElementById("upload-form"));
	$.ajax({
		type: "POST",
		url: $("#alfroot").val().trim() + "/service/api/upload?alf_ticket=" + ticket,
		cache: false,
		contentType: false, //altrimenti jQuery manipola i dati
		processData: false,
		dataType: "json",
		data: formData,
				
		//prima di spedire sistemo i dati
		beforeSend: function() {
			showMessage("Upload...", GREEN_COLOR);
			console.log("[main.alfrescoUpload] uploading...");
			
			var uploadDir = $("#uploaddirectory").val();
			$("#uploaddirectory").val(uploadDir.substring(1, uploadDir.length - 1)); //tolgo le barre
		},				
				
		//aggiornamento progress-bar durante l'upload dei dati
		xhr: function() {
			var xhr = new window.XMLHttpRequest();
			xhr.upload.addEventListener("progress", function(e) {
				if (e.lengthComputable) {
					var percentComplete = e.loaded / e.total;
					percentComplete = PERCENT_15 + percentComplete * PERCENT_75;
					NProgress.set(percentComplete);
				}
			}, false);
			return xhr;
		},						
		success: function (json) {   
			console.log("[main.alfrescoUpload] upload-success");
			showMessage("UPLOAD OK", GREEN_COLOR);		
			console.log("[main.alfrescoUpload] upload-resp = " + JSON.stringify(json) );
		},
		error: function (json) {
			//console.log("[main] upload-resp = " + JSON.stringify(json));
			manageAjaxError(json);
		},
		complete: function () {
			console.log("[main.alfrescoUpload] upload-complete");
			
			$("#upload-icon").removeClass("icon-not-clickable"); //riabilito il click sul pulsante di upload
			//riabilito la possibilit� di modificare i dati di upload
			$("#upload-form-wrapper input").each(function (index) {
				$(this).prop("readonly", false);
			});
			NProgress.done();
		}
	});
}

//gestisce errore nelle chiamate AJAX durante l'upload
function manageAjaxError(json) {
	console.log("[main.manageAjaxError] upload-resp = " + JSON.stringify(json) );
	resp = JSON.parse(JSON.stringify(json));
	var message = chrome.i18n.getMessage("msg_error_ajax");
	if (resp.responseJSON !== undefined ) {
		//message = "code: " + resp.responseJSON.status.code + "\nname: " + resp.responseJSON.status.name + "\ndescription: " + resp.responseJSON.status.description + "\nmessage: " + resp.responseJSON.message;
		//message = resp.responseJSON.message;;
		message = chrome.i18n.getMessage("msg_error_ajax", [resp.responseJSON.status.code, resp.responseJSON.message]);
	}
	else if (resp.statusText !== undefined && resp.status !== 0) {
		//message = "ERR: " + resp.statusText + "-" + resp.status;
		message = chrome.i18n.getMessage("msg_error_ajax", [resp.status, resp.statusText]);
	}
	else {
		//message = "Unknown Error (maybe '" + $("#alfroot").val() + "' is not available)";
		message = chrome.i18n.getMessage("msg_error_ajax", ["Unknown", "Unknown Error (maybe '" + $("#alfroot").val() + "' is not available)"]);
	}
	console.log("[main.manageAjaxError]" + message);
	showMessage(message, RED_COLOR);
}

//aggiorna la lista dei profili in pagina
function refreshProfilesList() {
	//recupero lista profili (vedi store-manager.js)
	getProfilesList(function(result) {
		if (typeof result === 'string' ) {
			//errore
			//showMessage("Errore nel recupero lista profili: " + result, RED_COLOR);
			showMessage(chrome.i18n.getMessage("msg_error_refreshing_profiles_list", result), RED_COLOR);
		}
		else {		
			$("#select-profile").empty(); //svuoto la lista su pagina
			if (!$.isEmptyObject(result)) {
				var profiles = result;
				
				//aggiorno la lista lista su pagina
				for (var i = 0; i < profiles.length; i++) {
					$("#select-profile").append("<option value='" + profiles[i] + "'>" + profiles[i] + "</option>");
				}
				console.log("[main.refreshProfilesList] lista profili su pagina svuotata e ripopolata: [" + profiles + "]");
				$("#select-profile").prop("selectedIndex", -1); //default scelta vuota				
			}
			else {
				console.log("[main.refreshProfilesList] lista profili vuota su db");
			}
		}
	});
}

//carica in form ultimi dati di upload usati
function loadLastUsedUploadData() {
	getLastUsedUploadData(function(data) {
		if (typeof data === 'string' ) {
			//errore
			//showMessage("Errore nel recupero metadati di upload: " + data, RED_COLOR);
			showMessage(chrome.i18n.getMessage("msg_error_loading_last_used_upload_data", data), RED_COLOR);
		}
		else if (isUndefined(data) || $.isEmptyObject(data)) {
			console.log("[main.loadLastUsedUploadData] nessun dato di upload salvato (mai tentato un upload?)");
		}
		else {
			setUploadData(data);
			console.log("[main.loadLastUsedUploadData] dati di upload caricati in form");
		}
	});
}

//carica dati di upload nel form in pagina
function setUploadData(data) {

	$("#alfroot").val(data.alfroot);
	$("#siteid").val(data.siteid);
	$("#username").val(data.username);
	$("#password").val(data.password);
	$("#uploaddirectory").val(data.uploaddirectory);
	$("#overwrite").val(data.overwrite);
	
	//imposto o no la spunta sul checkbox di overwrite
	if (data.overwrite === "false") {
		$("#overwrite").prop('checked', false);
	}
	else {
		$("#overwrite").prop('checked', true);
	}
}

//show message in page (type=0 means success, type=1 means error)
function showMessage(message, color) {	
	$("#status-message").css("color", color);
	blinkBorder("status-message-wrap", color);
	$("#status-message").empty();
	$("#status-message").text(message);
}