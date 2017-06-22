/* Ask the Github API for the latest codepulse release, and set any `.version`
 * element's text to the "name" of that release.
 */
$.ajax('https://api.github.com/repos/secdec/codepulse/releases/latest')
	.fail(function(err){
		console.log('automatic "latest version" check failed', err)
		$(function(){
			$('.version').html('<em>automatic version check failed</em>')
		})
	})
	.done(function(info){
		$(function(){
			$('.version').text(info.name)
		})
	})