// ==UserScript==
// @name         MarkSteamOwned
// @namespace    http://tampermonkey.net/
// @version      2.7
// @description  try to take over the world!
// @author       Benzi
// @require      http://libs.baidu.com/jquery/2.1.4/jquery.min.js
// @match        http://steamfarmkey.ru/
// @match		 http://keymarket.pw/
// @match		 http://steam1.lequeshop.ru/
// @match		 http://lastkey.ru/*
// @match	 	 http://steamground.com/*
// @match		 http://steamkeyswhosales.com/
// @run-at		 document-start
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      store.steampowered.com
// @connect      www.steamgifts.com
// @connect      steamdb.sinaapp.com
// @icon         http://store.steampowered.com/favicon.ico
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    
	function attachOnReady(callback) 
	{
		document.addEventListener("DOMContentLoaded", function (e) 
		{
			callback();
		});
	}
    
    function markBundle(valid) {
		GM_xmlhttpRequest({
	        method: "GET",
	        url: "http://steamdb.sinaapp.com/app/" + valid + "/data.js",
	        onload: function(response) {
	        	var mess;
	            var data = response.responseText.substring(response.responseText.indexOf("{"), response.responseText.lastIndexOf("}") + 1).replace(/&quot;/g, "'");
	            if (data.length == 0) {
	                GM_xmlhttpRequest({
	                    method: "GET",
	                    url: "http://steamdb.sinaapp.com/app/" + valid+ "/data.js?v=34",
	                    onload: function(response) {
	                        var data = response.responseText.substring(response.responseText.indexOf("{"), response.responseText.lastIndexOf("}") + 1).replace(/&quot;/g, "'");
	                    	mess = data;
	                    }
	                });
	            }else{
	            	mess = data;
	            }
	            try{
	            	var game_data = JSON.parse(mess);
		            var history = game_data.price_history || {
		                "bundles": {
		                    "count": "-"
		                }
		            };
		            var price = game_data.price_steam.price ||{
		                "price":"NA"
		            };
		            var bundle = history.bundles.count;
		    		var name = game_data.name;
					markUnSgBundle(name,valid,price);
	            }catch(e){
	            	//TODO handle the exception
	            	throw(e.name);
	            }
	            
	        }
	    });
	}	
    
    function randNum(min, max)
	{
		return Math.round(Math.random() * (max - min) + min);
	}
    
	function markOwned(query, markOwnedCallback)
	{		
		var rgxId = /[0-9]{3,}/g;
		var rgxApp = /:\/\/((store\.steampowered|steamcommunity)\.com\/app|cdn.akamai.steamstatic.com\/steam\/apps|cdn.edgecast.steamstatic.com\/steam\/apps)\/[0-9]+/i;
		var rgxSub = /:\/\/store\.steampowered\.com\/sub\/[0-9]+/i;
		GM_xmlhttpRequest(
		{
			method: "GET",
			url: "https://store.steampowered.com/dynamicstore/userdata/?t=" + randNum(1000, 9999),
			onload: function(response) 
			{
				var dataRes = JSON.parse(response.responseText);
				var countOwned = [0, 0];
				var countAll = [0, 0];
				
				if (typeof dataRes["rgOwnedApps"] !== "undefined"
					&& typeof dataRes["rgOwnedPackages"] !== "undefined"
					&& typeof dataRes["rgIgnoredApps"] !== "undefined")
				{
					var eleApps = document.querySelectorAll(query);
					for (var i = 0; i < eleApps.length; i++)
					{
						var attrHref = eleApps[i].getAttribute("href") || eleApps[i].getAttribute("src") || eleApps[i].getAttribute("style") || eleApps[i].getAttribute("title");
						var ids = attrHref.match(rgxId);
						if (ids != null)
						{
							var valId = parseInt(ids[0]);
							if (rgxApp.test(attrHref))
							{
								if (dataRes["rgOwnedApps"].indexOf(valId) > -1)
								{
									markOwnedCallback(eleApps[i]);
									countOwned[0]++;
								}
								else
								{
									console.log("App: not owned - http://store.steampowered.com/app/" + valId + "/");
								}
								countAll[0]++;
							}
							else if (rgxSub.test(attrHref))
							{								
								if (dataRes["rgOwnedPackages"].indexOf(valId) > -1)
								{
									markOwnedCallback(eleApps[i]);
									countOwned[1]++;
								}
								else
								{
									console.log("Sub: not owned - http://store.steampowered.com/sub/" + valId + "/");
								}
								countAll[1]++;
							}
							markBundle(valId);
						}
					}
					
				}
				
				var diff = countAll[0] - countOwned[0];
				console.log("App: " + countOwned[0] + "/" + countAll[0] + (diff > 10 ? " Diff: " + diff : ""));				
				console.log("Sub: " + countOwned[1] + "/" + countAll[1]);
				
			} // End onload
		});
	}    
    
    function markUnSgBundle(name,valid,price){
    	GM_xmlhttpRequest({
	        method: "GET",
	        url: "https://www.steamgifts.com/bundle-games/search?q=" + name,
	        onload: function(response) {
	        	var data = response.responseText;
	        	var eleContainer = document.createElement("div");
	        	eleContainer.innerHTML = data;
	        	var eles = eleContainer.querySelectorAll("div[class='pagination__results']");
	        	var count = eles[0].innerHTML;
	        	if(count.indexOf("No results were found") > -1){
	        		console.log(name+"   - http://store.steampowered.com/app/" + valid + "/"+ " - " + price);
	        	}
	        }
	    });
    }
    
    function main(){
    	var url = document.documentURI;
    	GM_addStyle(" .bh_owned { background-color: #7CA156 !important;transition: background 500ms ease 0s; }");
    	if (url.indexOf("steamfarmkey.ru") > -1){
    		markOwned(".good-title > div[title*='store.steampowered.com/']", function(ele){
  				ele.parentElement.parentElement.classList.add("bh_owned");
    		});
    	}
    	
    	if (url.indexOf("keymarket.pw") > -1){
    		markOwned("div[style*='steam/apps/']", function(ele){
    			var eles = ele.parentElement.querySelectorAll(".mdl-card__actions");
                eles[0].classList.add("bh_owned");
    		});
    	}
    	
    	if (url.indexOf("steam1.lequeshop.ru") > -1){
    		markOwned("a[href*='/goods/info/'] > img[src*='steam/apps/']", function(ele){
				var eles = ele.parentElement.parentElement.parentElement.querySelectorAll(".name");
				eles[0].classList.add("bh_owned");
    		});
    	}
    	
    	if (url.indexOf("lastkey.ru") > -1){
    		
    		var divs = document.querySelectorAll("div[class*='v_title br2 left']");
    		for (var i = 0;i < divs.length;i++) {
    			divs[i].style.backgroundColor="#AAAAAA";
    		}
    		
    		markOwned("img[src*='steam/apps/']",function(ele){
    			ele.parentElement.classList.add("bh_owned");
    		});
    	}
    	
    	if(url.indexOf("steamkeyswhosales.com") > -1){
    		markOwned(".good-title > div[title*='store.steampowered.com/']", function(ele){
  				ele.parentElement.parentElement.classList.add("bh_owned");
    		});
    	}
    	
    	if (url.indexOf("steamground.com/") > -1){
    		//Bundle Helper 
			var elesTitle = document.querySelectorAll(".wholesale-card_title");
			if (elesTitle.length > 0)
			{
				GM_xmlhttpRequest(
				{
					method: "GET",
					url: "https://www.steamgifts.com/discussion/iy081/steamground-wholesale-build-a-bundle",
					onload: function(response) 
					{					
						var data = response.responseText;
						var eleContainer = document.createElement("div");
						eleContainer.innerHTML = data;
						
						var eleComment = eleContainer.querySelector(".comment__description");
						if (eleComment)
						{							
							var elesGame = eleComment.querySelectorAll("table td:nth-child(1) a[href*='store.steampowered.com/']");
							if (elesGame.length > 0)
							{
								var arrTitle = [];
								for (var i = 0; i < elesTitle.length; i++)
								{
									arrTitle.push(elesTitle[i].textContent.trim());
								}
								
								for (var i = 0; i < elesGame.length; i++)
								{
									var isMatch = false;
									var game = elesGame[i].textContent.trim().toLowerCase();
									for (var j = 0; j < elesTitle.length; j++)
									{
										var title = elesTitle[j].textContent.trim().toLowerCase();
										if (game === title
											|| (title.indexOf("|") > -1 && game === title.replace("|", ":"))
											|| (game === "ball of light" && title === "ball of light (journey)")
											|| (game === "its your last chance in new school" && title === "it is yоur last chance in new schооl")
											|| (game === "shake your money simulator 2016" && title === "shake your money simulator")
											|| (game === "spakoyno: back to the ussr 2.0" && title === "spakoyno back to the ussr 2.0")
											|| (game === "or" && title === "or!"))
										{
											isMatch = true;
											
											arrTitle = arrTitle.filter(function(value) 
											{ 
												return value !== elesTitle[j].textContent.trim() 
											});
										}
										
										if (isMatch)
										{
											var eleA = document.createElement("a");
											eleA.classList.add("bh_steam");
											eleA.href = elesGame[i].href;
											elesTitle[j].parentElement.parentElement.appendChild(eleA);
											
											break;
										}
									}
									if (!isMatch)
									{
										console.log("Not match: " + elesGame[i].href + " " + elesGame[i].textContent);
									}
								}

								if (arrTitle.length > 0)
								{
									console.log("Not match: " + arrTitle.length);
									for (var i = 0; i < arrTitle.length; i++)
									{
										console.log("Not match: " + arrTitle[i]);
									}
								}
			
								markOwned(".wholesale-card > a[href*='store.steampowered.com/']", function(ele)
								{
									ele.parentElement.classList.add("bh_owned");
								});	
							}
						}
						
					} // End onload
				});
			}
		}
    }
    
    attachOnReady(main);
})();