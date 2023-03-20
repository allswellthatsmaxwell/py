import React, {useEffect} from 'react';
import {View, FlatList, Text, StyleSheet} from 'react-native';
import * as firebase from 'firebase';

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
  }
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
      console.log("Logs: ", transcripts);
      setTranscriptsList(transcripts);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const timestamp_format = {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true
  };
  const tableData = transcriptsList.map((record) => ({
    timestamp: record.timestamp.toDate().toLocaleDateString([], timestamp_format),
    text: record.text,
    topics: record.topics,
    id: record.id
  }));

  return (
      <View style={projectStyles.topContainer}>
        <View style={[styles.mainTextContainer, {alignSelf: "flex-end"}]}>
          <FlatList
              data={tableData}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({item}) => (
                  <View style={styles.row}>
                    <Text style={[styles.cell, {textAlign: "left"}]}>
                      {item.text}
                    </Text>
                    <Text style={[styles.cell, {textAlign: "center"}]}>
                      {item.topics}
                    </Text>
                    <Text style={[styles.cell, {textAlign: "right"}]}>
                      {item.timestamp}
                    </Text>
                  </View>
              )}
          />
        </View>
      </View>
  );
}
