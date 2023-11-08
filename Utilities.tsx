
import firebase from "firebase/app";
import { Alert } from 'react-native';

export function sortDateTime(a, b) {
  {
    const datetimeA: any = new Date(a.date + " " + a.time);
    const datetimeB: any = new Date(b.date + " " + b.time);
    return datetimeB - datetimeA;
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
  const day = date.getDate() + 1;

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
    if ("topics" in entriesList) {
      entriesList = entriesList["topics"];
    }

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

export const deleteMatchingEntries = async (
  userId: string, topic: string, entryIds: string[],
  batch: firebase.firestore.WriteBatch): Promise<void> => {
  const entriesRef = firebase
    .firestore()
    .collection('users')
    .doc(userId)
    .collection('topics')
    .doc(topic)
    .collection('entries');

  for (const entryId of entryIds) {
    const entryRef = entriesRef.doc(entryId);
    const entryDoc = await entryRef.get();
    if (entryDoc.exists) {
      const entryData = entryDoc.data();
      console.log("Deleting entryRef with entryData: ", entryData);
    }
    batch.delete(entryRef);
  }
}



export const fetchIdsField = async (ref: firebase.firestore.DocumentReference) => {
  try {
    const doc = await ref.get();
    if (doc.exists) {
      const idsList = doc.data().ids;
      console.log('ids list:', idsList);
      return idsList;
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching ids field:', error);
  }
}

export const onDelete = async (userId: string, transcriptId: string, entries: string) => {
  Alert.alert(
    "Delete Transcript",
    "Are you sure you want to delete this transcript and its entries?",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          const batch = firebase.firestore().batch();

          // Delete transcript
          const transcriptRef = firebase
            .firestore()
            .collection("users")
            .doc(userId)
            .collection("transcripts")
            .doc(transcriptId);

          const entryIds = await fetchIdsField(transcriptRef);
          console.log("ENTRIES IN onDelete: ", entries);
          // Delete entries
          for (const entry of JSON.parse(entries)) {
            console.log("ENTRY in onDelete loop: ", entry);
            await deleteMatchingEntries(userId, entry.topic, entryIds, batch);
          }

          batch.delete(transcriptRef);
          await batch.commit();
        },
      },
    ]
  );
};

export const onDeleteWithSetters = async (
  userId: string, transcriptId: string, entries: string,
  setTopicsResult: any, setTranscriptionResult: any) => {
    onDelete(userId, transcriptId, entries);
    setTopicsResult(null);
    setTranscriptionResult(null);
  }