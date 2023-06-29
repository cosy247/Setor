const cheerio = require("cheerio");

const body = cheerio.load(`
	<app-root>
	<h1 class='123' :asdf="asd > 123">{{ data[0].asdf }}</h1>
	<h1>{{ data[0].asdf123 }}</h1>
	</app-root>

	<script>
	import 123 from './index';
	const data = [
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
		{asdf:2345, asdf123: 234, kas: 2934},
	];
	</script>

	<style>
	* {
		padding: 0;
		margin: 0;
	}
	</style>
`, null, false);

console.log(body('script')[0]); 

