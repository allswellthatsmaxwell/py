import * as React from "react";
import { useEffect } from "react";
import { Table, Row, Rows } from "react-native-table-component";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import * as firebase from "firebase";
// import { Sparklines, SparklinesBars } from "react-sparklines";
import moment from "moment";

import { getStyles } from "./styles.js";

const styles = getStyles();

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    // paddingVertical: 10,
    marginRight: 5,
  },
  bar: {
    width: 10,
    marginBottom: 0,
    marginRight: 1,
    backgroundColor: "#848484",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

export function TopicsList({ userId, setSelectedTopic }) {
  const [topicsList, setTopicsList] = React.useState([]);
  const [entriesDayCounts, setEntriesDayCounts] = React.useState({});

  const handleTopicPress = (topic) => {
    setSelectedTopic(topic);
  };

  const renderSeparator = () => {
    return <View style={{ height: 1, backgroundColor: "gray" }} />;
  };

  function getEntriesDayCounts(topics_snapshot) {
    // returns a mapping from entry to day to count
    const topicsList = topics_snapshot.docs.map((doc) => doc.id);
    const dayCounts = {};

    const batchSize = 10; // maximum number of topics per query
    const batches = [];
    for (let i = 0; i < topicsList.length; i += batchSize) {
      batches.push(topicsList.slice(i, i + batchSize));
    }

    const promises = batches.map((batch) => {
      const entriesCollection = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("topics")
        .where(firebase.firestore.FieldPath.documentId(), "in", batch)
        .get();

      return entriesCollection;
    });

    Promise.all(promises).then((snapshots) => {
      snapshots.forEach((snapshot) => {
        snapshot.forEach((doc) => {
          const topic = doc.id;
          const entriesSnapshot = doc.ref.collection("entries");

          entriesSnapshot.onSnapshot((snapshot) => {
            const counts = {};

            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              const date = new Date(data.timestamp.toDate());
              const day = date.toISOString().split("T")[0];

              if (!counts[day]) {
                counts[day] = 0;
              }

              counts[day] += data.number;
            });

            dayCounts[topic] = counts;
            setEntriesDayCounts((prevDayCounts) => ({
              ...prevDayCounts,
              ...dayCounts,
            }));
          });
        });
      });
    });
  }

  useEffect(() => {
    const topicsCollection = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("topics");

    const unsubscribe = topicsCollection.onSnapshot((snapshot) => {
      const topics = snapshot.docs.map((doc) => doc.id);
      console.log("userId: ", userId);
      console.log("Topics: ", topics);
      setTopicsList(topics);
      getEntriesDayCounts(snapshot);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  useEffect(() => {
    console.log("entriesDayCounts: ", entriesDayCounts);
  }, [entriesDayCounts]);

  return (
    <View
      style={[
        styles.topicsTableContainer,
        { borderWidth: 1, borderColor: "black" },
      ]}
    >
      <FlatList
        data={Object.keys(entriesDayCounts)}
        renderItem={({ item }) => {
          const rowHeight = 20;
          const allDates = Object.keys(entriesDayCounts).reduce(
            (acc, topic) => [...acc, ...Object.keys(entriesDayCounts[topic])],
            []
          );
          const uniqueDates = [...new Set(allDates)];
          const sortedDates = uniqueDates.sort((a, b) => b.localeCompare(a));
          const todayDate = moment().toISOString().split("T")[0];
          const maxDataValue = Math.max(
            ...Object.values(entriesDayCounts[item])
          );
          const scaleFactor =
            maxDataValue > 0 ? rowHeight / (maxDataValue * 10) : 1;
          const dateDict = Object.keys(entriesDayCounts[item]).reduce(
            (acc, date) => {
              acc[date] = entriesDayCounts[item][date];
              return acc;
            },
            {}
          );

          return (
            <TouchableOpacity onPress={() => handleTopicPress(item)}>
              <View style={rowStyles.row}>
                <Text style={styles.rowText}>{item}</Text>
                <View style={rowStyles.chart}>
                  {sortedDates.map((date, index) => (
                    <View
                      key={index}
                      style={[
                        rowStyles.bar,
                        {
                          height: dateDict[date] * 10 * scaleFactor,
                          left:
                            (moment(date) - todayDate) /
                            (1000 * 60 * 60 * 24),
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item}
        style={styles.flatList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
      />
    </View>
  );
}

export function EntriesForTopic({ userId, selectedTopic }) {
  return (
    <View style={styles.topContainer}>
      <LogsList userId={userId} topic={selectedTopic} />
    </View>
  );
}

function LogsList({ userId, topic }) {
  const [logsList, setLogsList] = React.useState([]);

  useEffect(() => {
    const logsCollection = firebase
      .firestore()
      .collection("users")
      .doc(userId)
      .collection("topics")
      .doc(topic)
      .collection("entries");

    const unsubscribe = logsCollection.onSnapshot((snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Logs: ", logs);
      setLogsList(logs);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, topic]);

  const tableHead = ["Date", "Time", "Value"];
  // formats like "July 6, 11:36 PM"
  const time_format = { hour: "2-digit", minute: "2-digit", hour12: true };
  const day_format = { month: "short", day: "numeric" };
  const tableData = logsList.map((log) => [
    log.timestamp.toDate().toLocaleDateString([], day_format),
    log.timestamp.toDate().toLocaleTimeString([], time_format),
    log.number,
  ]);

  return (
    <View style={{ height: 100, width: 300 }}>
      <Table
        style={{ width: "100%" }}
        borderStyle={{ borderWidth: 1, borderColor: "#bbb" }}
      >
        <Row
          data={tableHead}
          style={{ backgroundColor: "#f1f8ff" }}
          textStyle={{ margin: 1 }}
        />
        <Rows data={tableData} textStyle={{ margin: 1 }} />
      </Table>
    </View>
  );
}
