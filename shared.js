 this.getBeginEndDates = async function() {
	console.log("Input dates in this format 'YEAR_MONTH_DAY', for example '2019_01_23'");
	let datesAreGood = false;
	while (!datesAreGood) {
		begin = await this.getDateFromUser('date_begin: ');
		end = await this.getDateFromUser('date_end: ');

		if (this.dateEqualsDate(begin, end) > 0) {
			console.log("ERROR: date_begin is bigger than date_end "+this.getDateString(begin)+" > "+this.getDateString(end)+"\n");
		} else datesAreGood = true;
	}
	console.log(" ");
	return {begin, end}
}

this.getDateFromUser = async function(question) {
	let dateIsGood = false;
	let date;
	while (!dateIsGood) {
		let dateStr = await this.getUserInput(question);
		try {
			date = this.stringToDate(dateStr);
			let d = new Date(date[0]+'-'+date[1]+'-'+date[2]);
			if (isNaN(d.getTime())) console.log("ERROR: Invalid date: "+dateStr+"\n");
			else dateIsGood = true;
		} catch (err) {
			console.log("ERROR: Invalid date: "+dateStr+"\n");
		}
	}
	return date;
}

this.testDateString = function(str){
	try {
			let date = this.stringToDate(str);
			let d = new Date(date[0]+'-'+date[1]+'-'+date[2]);
			if (isNaN(d.getTime())){
				console.log("ERROR: Invalid date: "+str+"\n");
				return []
			}
			else 
				return date
		} catch (err) {
			console.log("ERROR: Invalid date: "+dateStr+"\n");
			return []
		}
}

const readline = require('readline');

this.getUserInput = async function(question) {
	return new Promise( function (resolve, reject) {
// -------------------------------------------------------------------
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question(question, (answer) => {
	  		rl.close();
			resolve(answer);
		});
// -------------------------------------------------------------------
	});
}

this.stringToDate = function(dateStr) {
	let splitted = dateStr.split('_');
	for (var i = 0; i < 3; i++) {
		splitted[i] = splitted[i].match(/[0-9]+/);
	}
	let date = [ parseInt(splitted[0]) , parseInt(splitted[1]) , parseInt(splitted[2]) ];
	return date;
}


this.getDateString = function(date) {
 	var str = "";
	str = date[0] + "_";
	if (date[1] < 10) str += 0;
	str += date[1] + "_";
	if (date[2] < 10) str += 0;
	str += date[2];
	return str;
}

// returns 0 if they are equal, 1 if dateA is bigger, -1 if dateA is smaller
// dateA = [ 2018, 11, 23 ]; // for example
this.dateEqualsDate = function(dateA, dateB) {
	for (var d in dateA) {
		if (dateA[d] > dateB[d]) return 1;
		if (dateA[d] < dateB[d]) return -1;
	}
	return 0;
}

this.changeDate = function(date, n) {
	let d = new Date(date[0]+'-'+date[1]+'-'+date[2]);
	d.setUTCDate(d.getUTCDate()+n);
	this.jsDateToDate(d, date);
}

this.jsDateToDate = function(jsDate, date) {
	date[0] = jsDate.getUTCFullYear();
	date[1] = jsDate.getUTCMonth()+1;
	date[2] = jsDate.getUTCDate();
}
