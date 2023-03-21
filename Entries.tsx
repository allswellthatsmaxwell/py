import {TouchableOpacity, View, FlatList, Text, StyleSheet} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import * as firebase from "firebase";
import {Swipeable} from "react-native-gesture-handler";

import {getStyles} from "./styles";
import {MaterialCommunityIcons} from "@expo/vector-icons";

const projectStyles = getStyles();

const styles = StyleSheet.create({
  tableContainer: {
    height: 400,
    width: 400,
    borderWidth: 1,
    marginTop: 20,
    borderColor: "#fff"
  },
  entryRow: {
    backgroundColor: "#fff",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 50,
    flex: 1,
    flexDirection: "row",
    marginBottom: 2,
    height: 30
  },
  cell: {
    margin: 3,
    alignContent: "center",
    flex: 1,
    fontSize: 18,
    marginHorizontal: 10,
  }
});

export function EntriesForTopic({userId, selectedTopic}) {
  return (
      <View>
        <Text style={{fontSize: 26, textAlign: "center", marginTop: 10,
                      textDecorationLine: "underline", textDecorationColor: 'gray',
        }}>
          {selectedTopic}
        </Text>
        <View style={projectStyles.topContainer}>
          <LogsList userId={userId} topic={selectedTopic}/>
        </View>
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
          <View style={styles.entryRow}>
            <Text style={[styles.cell, {textAlign: "left"}]}>{item.date}</Text>
            <Text style={[styles.cell, {textAlign: "center"}]}>{item.time}</Text>
            <Text style={[styles.cell, {textAlign: "right"}]}>{item.value}</Text>
          </View>
        </Swipeable>
    );
  };

  const renderHeader = () => (
      <View style={[styles.entryRow, {borderWidth: 1, backgroundColor: "#B0C4DE"}]}>
        <Text style={[styles.cell, {textAlign: "left"}]}>date</Text>
        <Text style={[styles.cell, {textAlign: "center"}]}>time</Text>
        <Text style={[styles.cell, {textAlign: "right"}]}>value</Text>
      </View>
  );


  const tableData = logsList.map((log) => ({
    date: formatDate(log.date),
    time: formatTime(log.time),
    value: log.value,
    id: log.id
  }));

  return (
      <View>
        <View style={[styles.tableContainer]}>
          <FlatList
              data={tableData}
              renderItem={renderItem}
              ListHeaderComponent={renderHeader}
              nestedScrollEnabled={true}
              overScrollMode={"never"}
              keyExtractor={(item, index) => item.id}
          />
        </View>
      </View>
  );
}