export function sortDateTime(a, b) {
  {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (dateA < dateB) {
      return 1;
    } else if (dateA > dateB) {
      return -1;
    } else {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      if (timeA < timeB) {
        return 1;
      } else if (timeA > timeB) {
        return -1;
      } else {
        return 0;
      }
    }
  }
}


function formatDate(input: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const date = new Date(input);
  const year = date.getFullYear().toString().slice(2);
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${month} ${day} '${year}`;
}

function formatTime(input: string): string {
  const [hourStr, minuteStr] = input.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const amPm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  const formattedMinute = minute === 0 ? '' : `:${minute.toString().padStart(2, '0')}`;

  return `${formattedHour}${formattedMinute}${amPm}`;
}

export class Entry {
  date: string;
  time: string;
  value: string;
  id: string;

  constructor(log) {
    this.date = formatDate(log.date);
    this.time = formatTime(log.time);
    this.value = log.value;
    this.id = log.id;
  }
}

export class parsedEntries {
  entriesString: string;
  entriesList: [];

  constructor(entriesString: string, entriesList: []) {
    this.entriesString = entriesString;
    this.entriesList = entriesList
  }
}

export function parseEntriesFromJson(entries: string): parsedEntries {
  let entriesList;
  let entriesString;
  try {
    console.log("Trying to parse entries: ", entries);
    entriesList = JSON.parse(entries);
    entriesString = entries;
    console.log("Parsed entries: ", entriesList);
  } catch (e) {
    console.log("Error parsing entries: ", e);
    entriesList = [];
    entriesString = "[]";
  }
  return new parsedEntries(entriesString, entriesList);
}