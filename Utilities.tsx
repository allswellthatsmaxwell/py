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


export function formatDate(input: string, include_year: boolean = true): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const date = new Date(input);
  const year = date.getFullYear().toString().slice(2);
  const month = months[date.getMonth()];
  const day = date.getDate();

  if (include_year) {
    return `${month} ${day}, ${year}`;
  } else {
    return `${month} ${day}`;
  }
}

export function formatTime(input: string): string {
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


export function getEnglishTimeDifference(timestamp: string) {
  // gets the difference between the current time and the timestamp.
  // If it was less than a minute ago, it returns "just now"
  // If it was less than an hour ago, it returns "x minutes ago"
  // If it was less than a day ago, it returns "x hours ago"
  // If it was less than a week ago, it returns "x days ago"
  // If it was less than a month ago, it returns "x weeks ago"
  // If it was less than a year ago, it returns "x months ago"
  // If it was more than a year ago, it returns "x years ago"

  console.log("Timestamp: ", timestamp);
  const time = new Date(timestamp);
  const now = new Date();
  const difference = now.getTime() - time.getTime();
  console.log("Time: ", time);
  console.log("Now: ", now);
  console.log("Difference: ", difference);


  const seconds = difference / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 30;
  const years = days / 365;
  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return Math.round(minutes) + " min";
  } else if (hours < 24) {
    const h = Math.round(hours);
    return h + " hour" + (h === 1 ? "" : "s");
  } else if (days < 7) {
    const d = Math.round(days);
    return d + " day" + (d === 1 ? "" : "s");
  } else if (weeks < 4) {
    const w = Math.round(weeks);
    return w + " week" + (w === 1 ? "" : "s");
  } else if (months < 12) {
    const m = Math.round(months);
    return m + " month" + (m === 1 ? "" : "s");
  } else {
    const y = Math.round(years);
    return y + " year" + (y === 1 ? "" : "s");
  }
}
