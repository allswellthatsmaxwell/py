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
    marginRight: 0,
    backgroundColor: "#848484",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

export function TopicsList({ userId, setSelectedTopic }) {
  const [topicsList, setTopicsList] = React.useState([]);

  const handleTopicPress = (topic) => {
    setSelectedTopic(topic);
  };

  const renderSeparator = () => {
    return <View style={{ height: 1, backgroundColor: "gray" }} />;
  };

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
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  return (
    <View
      style={[
        styles.topicsTableContainer,
        { borderWidth: 1, borderColor: "black" },
      ]}
    >
      <FlatList
        data={topicsList}
        renderItem={({ item }) => {
          const rowHeight = 20;
          const datalist = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
          const maxDataValue = Math.max(...datalist);
          const scaleFactor = maxDataValue > 0 ? rowHeight / (maxDataValue * 10) : 1;

          return (
            <TouchableOpacity onPress={() => handleTopicPress(item)}>
              <View style={rowStyles.row}>
                <Text style={styles.rowText}>{item}</Text>
                <View style={rowStyles.chart}>
                  {datalist.map((value, index) => (
                    <View
                      key={index}
                      style={[rowStyles.bar, { height: value * 10 * scaleFactor }]}
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
