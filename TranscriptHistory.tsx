import React, {useEffect} from 'react';
import {View, FlatList, Text, StyleSheet} from 'react-native';
import * as firebase from 'firebase';

import {
  parseEntriesFromJson, getEnglishTimeDifference,
  formatDate, formatTime
} from "./Utilities";
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

  function formatEntry(entry) {
    let s = "";
    if (entry.topic) {
      s += `${entry.topic}: `;
    }
    if (entry.value) {
      s += `\n${entry.value}`;
    }
    if (entry.date) {
      s += '\n' + formatDate(entry.date, false);
    }
    if (entry.time) {
      s += ', ' + formatTime(entry.time);
    }
    return s
  }

  function renderItem({item}) {
    return (
        <View style={styles.row}>
          <Text style={[styles.cell, {textAlign: "left"}]}>
            {item.text}
          </Text>
          <View style={styles.separator}/>
          <Text style={[styles.cell, {textAlign: "left"}]}>
            {item.entries.map(formatEntry).join("\n\n")}
          </Text>
          <View style={styles.separator}/>

          <Text style={[styles.cell, {textAlign: "right"}]}>
            {getEnglishTimeDifference(item.timestamp)}
          </Text>
        </View>
    );
  }

  const tableData = transcriptsList.map((record) => ({
    timestamp: record.timestamp.toDate(),//.toLocaleDateString([], timestamp_format),
    text: record.text,
    entries: parseEntriesFromJson(record.entries).entriesList.map(entry => {
      return entry
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
