import React, {useState, useEffect, useCallback} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import firebase from "firebase";
import Swiper from "react-native-deck-swiper";

import {formatDate} from "./Utilities";


export function TranscriptHistory({userId}: { userId: string }) {
  const [transcripts, setTranscripts] = useState([]);

  useEffect(() => {
    const unsubscribe = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("transcripts")
        .orderBy("timestamp", "desc")
        .onSnapshot((snapshot) => {
          const fetchedTranscripts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          console.log("fetchedTranscripts: ", fetchedTranscripts);
          setTranscripts(fetchedTranscripts);
        });

    return () => unsubscribe();
  }, [userId]);

  async function deleteMatchingEntries(topic: string, entryIds: string[],
                                       batch: firebase.firestore.WriteBatch): Promise<void> {
    const entriesRef = firebase
        .firestore()
        .collection('users')
        .doc(userId)
        .collection('topics')
        .doc(topic)
        .collection('entries');

    for (const entryId of entryIds) {
      const entryRef = entriesRef.doc(entryId);
      const entryDoc = await entryRef.get();
      if (entryDoc.exists) {
        const entryData = entryDoc.data();
        console.log("Deleting entryRef with entryData: ", entryData);
      }
      batch.delete(entryRef);
    }
  }

  async function fetchIdsField(ref: firebase.firestore.DocumentReference) {
    try {
      const doc = await ref.get();
      if (doc.exists) {
        const idsList = doc.data().ids;
        console.log('ids list:', idsList);
        return idsList;
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error fetching ids field:', error);
    }
  }

  const onDelete = async (transcriptId: string, entries) => {
    Alert.alert(
        "Delete Transcript",
        "Are you sure you want to delete this transcript and its entries?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "OK",
            onPress: async () => {
              const batch = firebase.firestore().batch();

              // Delete transcript
              const transcriptRef = firebase
                  .firestore()
                  .collection("users")
                  .doc(userId)
                  .collection("transcripts")
                  .doc(transcriptId);
              
              const entryIds = await fetchIdsField(transcriptRef);

              // Delete entries
              for (const entry of JSON.parse(entries)) {
                await deleteMatchingEntries(entry.topic, entryIds, batch);
              }

              batch.delete(transcriptRef);
              await batch.commit();
            },
          },
        ]
    );
  };

  const renderCard = (item) => {
    console.log("renderCard item: ", item);
    if (!item) {
      return (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text>Something went wrong.</Text>
          </View>
      );
    } else {
      return (
          <View
              style={{
                borderRadius: 10,
                padding: 20,
                alignSelf: "center",
                height: "50%",
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
                  backgroundColor: "red",
                  borderRadius: 50,
                  width: 30,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => onDelete(item.id, item.entries)}
            >
              <Text style={{color: "white", fontWeight: "bold"}}>X</Text>
            </TouchableOpacity>
            <View>
              <Text style={{fontWeight: "bold", fontSize: 18}}>Transcript</Text>
              <Text>{item.text}</Text>
            </View>
            <View style={{flex: 1, marginTop: 20}}>
              <Text style={{fontWeight: "bold", fontSize: 18}}>Entries</Text>
              {JSON.parse(item.entries).map((entry, index) => (
                  <Text key={index}>
                    {entry.topic}: {entry.value} at {entry.time} on {formatDate(entry.date)}
                  </Text>
              ))}
            </View>
            <View style={{alignItems: "flex-end"}}>
              <Text style={{fontStyle: "italic"}}>
                Recorded {new Date(item.timestamp?.toDate()).toLocaleString()}
              </Text>
            </View>
          </View>
      );
    }
  };

  if (transcripts.length === 0) {
    return (
        <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
          <Text>Loading transcripts...</Text>
        </View>
    );
  } else {
    return (
        <View style={{flex: 1}}>
          <Swiper
              cards={transcripts}
              renderCard={renderCard}
              backgroundColor="transparent"
              cardIndex={0}
              stackSize={3}
              stackSeparation={15}
              animateCardOpacity
              showSecondCard
              disableBottomSwipe
              disableTopSwipe
              onSwiped={(cardIndex) => console.log(cardIndex)}
              onSwipedAll={() => console.log("All cards swiped")}
          />
        </View>
    );
  }
};

