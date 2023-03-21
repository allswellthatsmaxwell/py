import React, {useEffect} from 'react';
import {View, FlatList, Text, StyleSheet} from 'react-native';
import * as firebase from 'firebase';

import {parseEntriesFromJson, sortDateTime, Entry} from "./Utilities";
import {getStyles} from './styles';

const projectStyles = getStyles();

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    backgroundColor: "white",
    width: "100%",
    flexWrap: "wrap",
    borderBottomWidth: 1,
  },
  mainTextContainer: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    // alignSelf: "flex-start",
    maxWidth: "100%",
    width: 400,
    height: 600,
    maxHeight: 600,
    // padding: 10,
    paddingHorizontal: 10,
    marginTop: 0,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000",
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    alignItems: "center",
  },
  separator: {
    height: '100%',
    width: 1,
    backgroundColor: 'gray',
    marginHorizontal: 8,
  },
});

const subTableStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  entryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryTopic: {
    textAlign: 'left',
  },
  entryValue: {
    textAlign: 'right',
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
  },
});

export function TranscriptHistory({userId}) {

  const [transcriptsList, setTranscriptsList] = React.useState([]);

  useEffect(() => {
    const transcriptsCollection = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("transcripts");

    const unsubscribe = transcriptsCollection.onSnapshot((snapshot) => {
      const transcripts = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
      transcripts.sort((a, b) => b.timestamp - a.timestamp);
      // console.log("Logs: ", transcripts);
      setTranscriptsList(transcripts);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  function getEnglishTimeDifference(timestamp: string) {
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
      return Math.round(hours) + " hours";
    } else if (days < 7) {
      return Math.round(days) + " days";
    } else if (weeks < 4) {
      return Math.round(weeks) + " weeks";
    } else if (months < 12) {
      return Math.round(months) + " months";
    } else {
      return Math.round(years) + " years";
    }

  }

  function renderItem({item}) {
    return (
        <View style={styles.row}>
          <Text style={[styles.cell, {textAlign: "left"}]}>
            {item.text}
          </Text>
          <View style={styles.separator}/>


          <Text style={[styles.cell, {textAlign: "center"}]}>
            {item.entries.map(entry => entry.topic + ": " + entry.value).join("\n")}
          </Text>
          <View style={styles.separator}/>

          <Text style={[styles.cell, {textAlign: "right"}]}>
            {getEnglishTimeDifference(item.timestamp)}
          </Text>
        </View>
    );
  }

  const timestamp_format = {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  };
  const tableData = transcriptsList.map((record) => ({
    timestamp: record.timestamp.toDate(),//.toLocaleDateString([], timestamp_format),
    text: record.text,
    entries: parseEntriesFromJson(record.entries).entriesList.map(entry => {
      console.log("entry: ", entry);
      return {
        topic: entry.topic,
        value: entry.value
      }
    }),
    id: record.id
  }));

  return (
      <View style={projectStyles.topContainer}>
        <View style={[styles.mainTextContainer, {alignSelf: "flex-end"}]}>
          <FlatList
              data={tableData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
          />
        </View>
      </View>
  );
}
