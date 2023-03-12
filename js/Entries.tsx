import {TouchableOpacity, View, Animated, FlatList, Text, StyleSheet} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import * as firebase from "firebase";
import {Table, Row, Rows} from "react-native-table-component";
import {Swipeable} from "react-native-gesture-handler";

import {getStyles} from "./styles";
import {Entypo, MaterialCommunityIcons} from "@expo/vector-icons";

const projectStyles = getStyles();

const styles = StyleSheet.create({
  container: {
    height: 100,
    width: 300,
    borderWidth: 1,
    borderColor: "#bbb"
  },
  header: {
    backgroundColor: "#f1f8ff",
    flexDirection: "row"
  },
  cell: {
    margin: 1,
    flex: 1
  }
});

export function EntriesForTopic({userId, selectedTopic}) {
  return (
      <View style={projectStyles.topContainer}>
        <LogsList userId={userId} topic={selectedTopic}/>
      </View>
  );
}

function LogsList({userId, topic}) {
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
      const logs = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
      logs.sort((a, b) => b.timestamp - a.timestamp);
      console.log("Logs: ", logs);
      setLogsList(logs);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, topic]);


  const swipeableRef = useRef(null);
  const handleDelete = (logId) => {
    // Delete the log from the database
    console.log("Deleting log ID: ", logId, " for topic: ", topic);
    firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("topics")
        .doc(topic)
        .collection("entries")
        .doc(logId)
        .delete()
        .then(() => {
          console.log("Log deleted successfully!");
          if (swipeableRef.current) {
            swipeableRef.current.close();
          }
        })
        .catch((error) => {
          console.error("Error deleting log: ", error);
        });
  };


  const renderRightActions = (progress, dragX, log) => {

    const trans = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [-20, 0, 100],
    });

    return (
        <TouchableOpacity
            style={{
              backgroundColor: "#EE3B3B",
              justifyContent: "center",
              alignItems: "flex-end",
              paddingHorizontal: 10,
              height: 70
            }}
            onPress={() => handleDelete(log.id)}
        >
          <View style={{width: 50, flex: 1}}>
            <MaterialCommunityIcons name="delete-forever" size={34} color="white"/>
          </View>
        </TouchableOpacity>
    );
  };

  const renderItem = ({item}) => {

    return (
        <Swipeable ref={swipeableRef}
                   renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
          <View style={styles.header}>
            <Text style={styles.cell}>{item.date}</Text>
            <Text style={styles.cell}>{item.time}</Text>
            <Text style={styles.cell}>{item.value}</Text>
          </View>
        </Swipeable>
    );
  };

  const time_format = {hour: "2-digit", minute: "2-digit", hour12: true};
  const day_format = {month: "short", day: "numeric"};
  const tableData = logsList.map((log) => ({
    date: log.timestamp.toDate().toLocaleDateString([], day_format),
    time: log.timestamp.toDate().toLocaleTimeString([], time_format),
    value: log.number,
    id: log.id
  }));

  return (
      <View style={styles.container}>
        <FlatList
            data={tableData}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id}
        />
      </View>
  );
}