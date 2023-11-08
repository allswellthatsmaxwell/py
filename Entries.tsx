import { TouchableOpacity, View, FlatList, Text, StyleSheet } from "react-native";
import * as React from "react";
import { useEffect, useRef } from "react";
import firebase from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

import { Swipeable } from "react-native-gesture-handler";

import { getStyles } from "./styles";
import { sortDateTime, Entry } from "./Utilities";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { Header } from "./Header";
import HeaderContext from './HeaderContext';


const projectStyles = getStyles();

const styles = StyleSheet.create({
  tableContainer: {
    height: "100%",
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

export function EntriesForTopic({ navigation }: any) {
  const { user, selectedTopic } = React.useContext(HeaderContext);

  const userId = user.uid;

  console.log(`EntriesForTopic: userId: ${userId}, selectedTopic: ${selectedTopic}`);
  return (
    <View style={projectStyles.globalBackground}>
      <Header navigation={navigation} />
      <Text style={{
        fontSize: 26, textAlign: "center", marginTop: 10,
        textDecorationLine: "underline", textDecorationColor: 'gray',
      }}>
        {selectedTopic}
      </Text>
      <View style={projectStyles.topContainer}>
        <LogsList userId={userId} topic={selectedTopic} />
      </View>
    </View>
  );
}

function LogsList({ userId, topic }: any) {
  const [logsList, setLogsList] = React.useState([]);
  const db = getFirestore();

  useEffect(() => {
    if (userId && topic) {

      const logsCollectionRef = collection(db, "users", userId, "topics", topic, "entries");

      const unsubscribe = onSnapshot(logsCollectionRef, (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // sorts logs first by date, then by time
        logs.sort(sortDateTime);
        // console.log("Logs: ", logs);
        setLogsList(logs);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [userId, topic]);


  const swipeableRef = useRef(null);

  const handleDelete = (logId: string) => {
    // Delete the log from the database
    console.log("Deleting log ID: ", logId, " for topic: ", topic);
    const logEntryRef = doc(db, "users", userId, "topics", topic, "entries", logId);

    deleteDoc(logEntryRef)
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

  // @ts-ignore
  const renderRightActions = (progress, dragX, log) => {
    return (
      <TouchableOpacity
        style={{
          justifyContent: "center",
          alignItems: "flex-end",
          paddingHorizontal: -10,
          height: 70
        }}
        onPress={() => handleDelete(log.id)}
      >
        <View style={{ width: 50, flex: 1 }}>
          <MaterialCommunityIcons name="delete-forever" size={34} color="red" />
        </View>
      </TouchableOpacity>
    );
  };

  // @ts-ignore
  const renderItem = ({ item }) => {
    return (
      <Swipeable ref={swipeableRef}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}>
        <View style={styles.entryRow}>
          <Text style={[styles.cell, { textAlign: "left" }]}>{item.date}</Text>
          <Text style={[styles.cell, { textAlign: "center" }]}>{item.time}</Text>
          <Text style={[styles.cell, { textAlign: "right" }]}>{item.value}</Text>
        </View>
      </Swipeable>
    );
  };

  const renderHeader = () => (
    <View style={[styles.entryRow, { borderWidth: 1, backgroundColor: "#B0C4DE" }]}>
      <Text style={[styles.cell, { textAlign: "left" }]}>date</Text>
      <Text style={[styles.cell, { textAlign: "center" }]}>time</Text>
      <Text style={[styles.cell, { textAlign: "right" }]}>value</Text>
    </View>
  );


  const tableData = logsList.map(log => new Entry(log));

  return (
    <View style={projectStyles.globalBackground}>
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