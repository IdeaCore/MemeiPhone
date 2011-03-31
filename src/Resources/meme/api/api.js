(function(){
	
	meme.api = {};

	meme.api.createTextPost = function(content) {
		return createPost('text', content);
	};
	
	meme.api.createPhotoPost = function(content, caption) {
		return createPost('photo', content, caption);
	};
	
	meme.api.flashlightFlickrPhoto = function(query) {
		var params = {
			//cacheKey: 'flashlight:flickrphotos:' + query,
			yqlQuery: 'SELECT * FROM flickr.photos.search WHERE text="' + query + '" AND license="4"'
		};
		var photos;
		var successCallback = function(results) {
			photos = results.photo;
		};
		var errorCallback = function() {
			photos = null;
		};
		cachedYqlQuery(params, successCallback, errorCallback);
		return photos;
	};
	
	meme.api.flashlightWebPhoto = function(query) {
		var params = {
			//cacheKey: 'flashlight:webphotos:' + query,
			yqlQuery: 'SELECT * FROM search.images WHERE query="' + query + ' -url:flickr.com" and filter="yes"'
		};
		var photos;
		var successCallback = function(results) {
			photos = results.result;
		};
		var errorCallback = function() {
			photos = null;
		};
		cachedYqlQuery(params, successCallback, errorCallback);
		return photos;
	};
	
	meme.api.flashlightVideo = function(query) {
		var params = {
			//cacheKey: 'flashlight:videos:' + query,
			yqlQuery: 'SELECT * FROM youtube.search WHERE query="' + query + '"'
		};
		var videos;
		var successCallback = function(results) {
			videos = results.video;
		};
		var errorCallback = function() {
			videos = null;
		};
		cachedYqlQuery(params, successCallback, errorCallback);
		return videos;
	};
	
	meme.api.flashlightWeb = function(query) {
		var params = {
			//cacheKey: 'flashlight:web:' + query,
			yqlQuery: 'SELECT title, abstract, url FROM search.web WHERE query="' + query + '"'
		};
		var items;
		var successCallback = function(results) {
			items = results.result;
		};
		var errorCallback = function() {
			items = null;
		};
		cachedYqlQuery(params, successCallback, errorCallback);
		return items;
	};
	
	meme.api.flashlightTwitter = function(query) {
		var params = {
			//cacheKey: 'flashlight:tweets:' + query,
			yqlQuery: 'SELECT * FROM twitter.search WHERE q="' + query + '"'
		};
		var items;
		var successCallback = function(results) {
			items = results.results;
		};
		var errorCallback = function() {
			ìtems = null;
		};
		cachedYqlQuery(params, successCallback, errorCallback);
		return items;
	};
	
	// Executes an API read query (select)
	var cachedYqlQuery = function(params, successCallback, errorCallback) {
		// default cache time is 15 minutes
		var cacheSeconds = 900;
		if (params.cacheSeconds) {
			cacheSeconds = params.cacheSeconds;
		}
		
		// -- cache not implemented yet
		//var items = cacheGet(params.cacheKey);
		var items;
		
		// if didn't find items in cache, go fetch them on YQL
		if (!items) {
			var yqlResponse = getYql().query(params.yqlQuery);
			
			if (!yqlResponse.query.results) {
				if (errorCallback) {
					errorCallback();
				} else {
					// -- not implemented yet
					//throwYqlError();
					meme.ui.alert({ title: 'Oops...', message: 'Error in YQL query :(' });
				}
			}

			items = yqlResponse.query.results;

			// -- not implemented yet
			// cache valid results only
			//if (items) {
			//	cachePut(params.cacheKey, items, cacheSeconds);
			//}
		}
		
		// if there are results (cached or not), execute successCallback
		if (items) {
			successCallback(items);
		}
	};
	
	var getYql = function() {
		return meme.auth.oadapter.getYql();
	};
	
	var createPost = function(type, content, caption) {
		var columns = 'type';
		var values = '\'' + type + '\'';
		if (content) {
			columns += ', content';
			values += ', \'' + content + '\'';
		}
		if (caption) {
			columns += ', caption';
			values += ', \'' + caption + '\'';
		}
		var yqlQuery = 'INSERT INTO meme.user.posts (' + columns + ') VALUES (' + values + ')';
		return execute(yqlQuery);
	};
	
	// Executes an API write query (insert, update, delete)
	var execute = function(yqlQuery) {
		var yqlResponse = getYql().query(yqlQuery);
		var results = yqlResponse.query.results;
		
		Ti.API.info("Results: ["+ JSON.stringify(results) +"]");
		
		if (!results) {
			// TODO: throw yql error
		}
		
		if (results.status && results.status.message == 'ok') { 
			return results;
		}
		return false;
	};
	
	meme.api.uploadImage = function(image, updateProgressCallback, successCallback) {
		var xhr = Titanium.Network.createHTTPClient();
		xhr.setTimeout(300000); // timeout to upload is 5 minutes

		// TODO: Listener to cancel post

		xhr.onerror = function(e) {
			// TODO: Hides the Progress bar
		};

		xhr.onload = function(e) {
			// TODO: updates the Message in the Progress Bar
			
	 		Ti.API.info('Upload complete!');
			Ti.API.info('api response was (http status ' + this.status + '): ' + this.responseText);

			try {
				var uploadResult = JSON.parse(this.responseText);

				if (uploadResult.status == 200) {
					successCallback(uploadResult.imgurl);
				} else {
					throw 'Upload error: ' + uploadResult.message;
				}
			} catch(exception) {
				// TODO: display error message
			}
		};

		xhr.onsendstream = function(e) {
			updateProgressCallback(e.progress);
			Ti.API.debug('upload progress: ' + e.progress);
		};

		// Resizes image before uploading
		// Max size accepted by Meme is 780x2500 px
		var new_size = meme.util.getImageDownsizedSizes(780, 2500, image);
		image = image.imageAsResized(new_size.width, new_size.height);

		// Create upload signture
		var time = parseInt(meme.util.timestamp()/1000);
		var signature = hex_hmac_sha1('yPVM.vcgXrYj50KG7ynt0sldjlDATLckdmn9h26YySg-', 'githubimeme' + ':' + time);
		
		// upload it!
		xhr.open('POST', 'http://meme.yahoo.com/api/image/');
		xhr.send({
			t: time,
			file: image,
			m: 'githubimeme',
			s: signature
		});
	};
	
})();