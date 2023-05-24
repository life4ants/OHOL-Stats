const shared = require("./shared.js")
const fs = require('fs')
const rootFolder = "oholData"
let outputResultsToFile = false
let outputResultsInline = false
let allLinks = {}
let dates = {begin: [], end: []}
let resultFile
let playerHash = ""
let player = {server: []}


let isWin = process.platform === "win32";
let fileSeperator = '/';
if (isWin) fileSeperator = '\\';


function Links() {
  this.link = ""; // contains link to the list of data and name links
  this.dateLinks = []; // contains link to text file that has the data - indices are dates like "2019_02_09"
}

async function main() {
	let args = process.argv;

	if (args.length < 3){//no arguments given
		console.log("This script will get all the lives you have played on your account with names and other info")
		console.log("The first argument is the account hash")
		console.log("You can add the beginning and ending dates as arguments. If you don't, you will be promted for them")
		console.log("Input dates in this format 'YEAR_MONTH_DAY', for example '2019_01_23'");
		return
	}

  playerHash = args[2]

	if(playerHash.match(/[^a-fA-F0-9]+/) || playerHash.length !== 40){
		console.log("ERROR: Invaid hash: "+args[2])
		return
	}
	if (args[3] && args[4]){
		 dates.begin = shared.testDateString(args[3])
		 dates.end = shared.testDateString(args[4])
	}
	if (dates.begin.length < 3 || dates.end.length < 3)
		dates = await shared.getBeginEndDates();

	let strOut = await shared.getUserInput('Do you want to save the results to a file? (y/n): ');
	if (strOut === 'Y' || strOut === 'y') outputResultsToFile = true;
	if (outputResultsToFile) {
		let fileIsGood = false;
		while (!fileIsGood) {
			resultFile = await shared.getUserInput('filename: ');
			try {
				fileIsGood = true;
				fs.writeFileSync(resultFile, "processing data... ");
			} catch (err) {
				console.log("ERROR: "+err);
				fileIsGood = false;
			}
		}
  }
  let print = await shared.getUserInput("Do you want shortened results in-line? (y/n): ")
  if (print === 'Y' || print === 'y') outputResultsInline = true;
	if (fs.existsSync(rootFolder)){
		await getAllFileLinks();
	}
  else {
		console.log("ERROR: No data downloaded")
    return
	}

	await downloadAndProcessData();
	logPlayerData();

}

main();


async function getAllFileLinks() {
  fs.readdirSync(rootFolder).forEach( (file) => {
    allLinks[file] = new Links();
  });
  for (var server in allLinks) {
    let dir = rootFolder + fileSeperator + server;
    allLinks[server].link = dir;
    fs.readdirSync(dir).forEach( (file) => {
      if (file.indexOf("curses") > -1) return;
      allLinks[server].dateLinks[file] = dir + fileSeperator + file;
    });
  }
}


async function downloadAndProcessData() {
  let date_current = [];
  for (var i = 0; i < 3; i++) {
    date_current[i] = dates.begin[i];
  }

  while (shared.dateEqualsDate(date_current, dates.end) <= 0) {
    let strDate = shared.getDateString(date_current);
    console.log("Get data for "+strDate+" ... "+shared.getDateString(dates.end));
    let noDataAvailable = true;
    for (var server in allLinks) {
      if (allLinks[server].dateLinks[strDate]){
        noDataAvailable = false;
        await processDataFromServer(server, strDate);
        await processDataFromServer(server, strDate+"_names")
      }
    }
    if (noDataAvailable){
      console.log("No data available for: "+strDate);
    }
    shared.changeDate(date_current, 1);
  }
}

async function processDataFromServer(strServer, strDate) {

  let file = rootFolder + fileSeperator + strServer + fileSeperator + strDate;
  let fileData = fs.readFileSync(file, 'utf8');
  let linesData = fileData.split('\n');

  
  for (var l in linesData) {
    processMainDataLine(strServer, linesData[l]);
  }
}

// B 1549411631 93326 5bc06d9755a0cdb55c1776a9b12709e1b2e487e7 F (1702,5693) parent=93206 pop=134 chain=25
// D 1549411621 93037 2616d079c748c8b69a461b4112ee057686c53284 age=34.10 M (4590,-10853) killer_93259 pop=133
// B 1549901981 991847 92ef593a488baacf8f4fa486ecae8df29c8de27c F (-49148,57297) noParent pop=1 chain=1
// D 1549902413 991847 92ef593a488baacf8f4fa486ecae8df29c8de27c age=21.20 F (-48671,57178) hunger pop=0
function processMainDataLine(strServer, line) {
  if (line.length < 2) return;
  let data = line.split(' ');
  if (!player.server[strServer]) player.server[strServer] = {};
  if (data.length === 9) {
    let unixTime = parseInt(data[1]);
    let playerId = data[2];
    let hash = data[3];

    if (hash === playerHash) {
      if (!player.server[strServer][playerId]) player.server[strServer][playerId] = {} 

      let record = player.server[strServer][playerId]

      if (data[0] === 'B') {
        record.birthTime = unixTime
        record.gender = data[4]
        record.birthCords = data[5]
        record.generation = parseInt(data[8].match(/[0-9\.]+/));
        record.name = "NAMELESS"
        
      } else if (data[0] === 'D') {
        record.deathTime = unixTime
        record.age = parseFloat(data[4].match(/[0-9\.]+/));
        record.deathCords = data[6]
        record.deathReason = String(data[7].match(/[a-zA-Z]+/));
      }
    }
  }
  else {
    let record = player.server[strServer][data[0]]
    if (record){
      record.name = data[1] 
      if (data[2]) record.name += " "+data[2]
    }
  }
}

function logResults(str) {
  if (outputResultsToFile) {
    fs.appendFileSync(resultFile, str+"\n");    
  } else console.log(str);
}

function logPlayerData() {
  if (outputResultsToFile) {
    fs.writeFileSync(resultFile, "=========================================="+"\n");
    console.log(" "); 
    console.log("Done! Saving results to '"+resultFile+"'");
  }
  if (!outputResultsToFile) console.log(" ");
  if (!outputResultsToFile) console.log("==========================================");
  for (let s in player.server){
    if (Object.keys(player.server[s]).length > 0){
      logResults("")
      logResults(s +":")
      logResults("")
    }
    for (let l in player.server[s]){
      let r = player.server[s][l]
      if (outputResultsInline){
        logResults(`${l}: ${getDateStringFromUnixTime(r.birthTime)}\t${r.gender}  Age: ${r.age}  \t${r.deathReason}  \t ${r.name}`)
      }
      else {
        logResults(l+":")
        logResults("Name: "+r.name)
        logResults("Gender: "+r.gender)
        logResults("Birth Time: "+getDateStringFromUnixTime(r.birthTime))
        logResults("Birth Cords: "+r.birthCords)
        logResults("Generation: "+r.generation)
        logResults("Death Time: "+ getDateStringFromUnixTime(r.deathTime))
        logResults("Death Cords: "+r.deathCords)
        logResults("Age: "+r.age)
        logResults("Cause of Death: "+r.deathReason)
        logResults("")
      }
    }
  }
  logResults("==========================================");
  logResults("")
}


function getDateStringFromUnixTime(unixTimeStamp) {
  return new Date(unixTimeStamp*1000).toUTCString();
}