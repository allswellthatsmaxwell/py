import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getFirestore,
  doc
} from 'firebase/firestore';

import { formatDate, onDelete } from "./Utilities";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Header } from "./Header";
import { getStyles } from "./styles";

const styles = getStyles();


export function TranscriptHistory({ route, navigation }: any) {
  const { userId } = route.params;
  const [transcripts, setTranscripts] = useState([]);
  const db = getFirestore();

  useEffect(() => {
    const q = query(
      collection(db, "users", userId, "transcripts"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTranscripts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched Transcripts: ", fetchedTranscripts);
      setTranscripts(fetchedTranscripts);
    });

    return () => unsubscribe();
  }, [userId]);


  // @ts-ignore
  const renderCard = (item) => {
    console.log("renderCard item: ", item);
    if (!item) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong.</Text>
        </View>
      );
    } else {
      const titleFontSize = 24;
      const textFontSize = 18;
      // @ts-ignore
      // @ts-ignore
      return (
        <View
          style={{
            borderRadius: 5,
            padding: 5,
            alignSelf: "center",
            height: "70%",
            width: "80%",
            justifyContent: "space-between",
            backgroundColor: "white",
            borderColor: "black",
            borderWidth: 1,
          }}
        >
          <TouchableOpacity
            style={{
              alignSelf: "flex-end",
              backgroundColor: "#EE4000",
              borderRadius: 50,
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => onDelete(userId, item.id, item.entries)}
          >
            <Text style={{ color: "white", fontSize: 30, fontWeight: "bold" }}>
              <MaterialCommunityIcons name="delete-forever" size={34} color="white" />
            </Text>
          </TouchableOpacity>
          <View>
            <Text style={{ fontWeight: "bold", fontSize: titleFontSize }}>Transcript</Text>
            <Text style={{ fontSize: textFontSize }}>{item.text}</Text>
          </View>
          <View style={{ flex: 1, marginTop: 20 }}>
            <Text style={{ fontWeight: "bold", fontSize: titleFontSize }}>Entries</Text>
            {JSON.parse(item.entries).map((entry: any, index: number) => (
              <Text key={index} style={{ fontSize: textFontSize }}>
                {entry.topic}: {entry.value} at {entry.time} on {formatDate(entry.date)}
              </Text>
            ))}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontStyle: "italic" }}>
              Recorded {new Date(item.timestamp?.toDate()).toLocaleString()}
            </Text>
          </View>
        </View>
      );
    }
  };

  const [swiperIndex, setSwiperIndex] = useState(0);

  const onPrevCard = () => {
    if (swiperIndex > 0) {
      setSwiperIndex(swiperIndex - 1);
    }
  };

  const onNextCard = () => {
    if (swiperIndex < transcripts.length - 1) {
      setSwiperIndex(swiperIndex + 1);
    }
  };

  if (transcripts.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading transcripts...</Text>
      </View>
    );
  } else {
    const arrowSize = 100;
    const arrowColor = "#EECBAD";
    return (
      <View style={styles.globalBackground}>
        <Header navigation={navigation} />
        <View style={{ paddingTop: 40 }}>
          {renderCard(transcripts[swiperIndex])}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              paddingLeft: 50,
              paddingRight: 50,
              marginTop: 20
            }}>
            <TouchableOpacity onPress={onPrevCard} disabled={swiperIndex === 0}>
              <Text>{swiperIndex === 0 ? '' :
                <Ionicons name="arrow-undo-sharp" size={arrowSize} color={arrowColor} />}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onNextCard} disabled={swiperIndex === transcripts.length - 1}>
              <Text>{
                swiperIndex === transcripts.length - 1 ?
                  '' :
                  <Ionicons name="arrow-redo-sharp" size={arrowSize} color={arrowColor} />}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
};

