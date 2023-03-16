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
    marginRight: 2,
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
              const date = new Date(data.date);
              console.log("date: ", date);
              let day = date.getDate().toString().padStart(2, '0');
              // convert day to number
              day = parseInt(day);

              console.log("day: ", day);

              if (!counts[day]) {
                counts[day] = 0;
              }

              counts[day] += data.value;
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
    // console.log("entriesDayCounts: ", entriesDayCounts);
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
          const sortedDates = uniqueDates.sort((a, b) => a.localeCompare(b));
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
                            (moment(date) - todayDate) / (1000 * 60 * 60 * 24),
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
        ListFooterComponent={() => (
          <View
            style={{
              borderBottomWidth: 1,
              borderBottomColor: "black",
            }}
          />
        )}
      />
    </View>
  );
}

