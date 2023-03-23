import {TouchableOpacity, View, FlatList, Text, StyleSheet} from "react-native";
import * as React from "react";
import {useEffect, useRef} from "react";
import firebase from "firebase";
import {Swipeable} from "react-native-gesture-handler";

import {getStyles} from "./styles";
import {sortDateTime, Entry} from "./Utilities";
import {MaterialCommunityIcons} from "@expo/vector-icons";

import {Header} from "./Header";

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

export function EntriesForTopic({route, navigation}: any) {
  const {userId, selectedTopic} = route.params;

  const handleBackPress = () => {
    navigation.goBack();
  };

  console.log(`EntriesForTopic: userId: ${userId}, selectedTopic: ${selectedTopic}`);
  return (
      <View>
        <Header handleBackPress={handleBackPress} />
        <Text style={{
          fontSize: 26, textAlign: "center", marginTop: 10,
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

function LogsList({userId, topic}: any) {
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
      // sorts logs first by date, then by time
      logs.sort(sortDateTime);
      // console.log("Logs: ", logs);
      setLogsList(logs);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, topic]);


  const swipeableRef = useRef(null);
  const handleDelete = (logId: string) => {
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


  const tableData = logsList.map(log => new Entry(log));

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