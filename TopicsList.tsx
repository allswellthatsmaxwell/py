import * as React from "react";
import {useEffect, useMemo} from "react";
import {
  Text,
  View,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import firebase from "firebase";
import moment from "moment";

import {getStyles} from "./styles";

const styles = getStyles();

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-end",
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
    justifyContent: "flex-end",
    flex: 1,
  },
  rowText: {
    fontSize: 20,
    color: "black",
    justifyContent: "flex-end",
    paddingLeft: 5
  },
});

// @ts-ignore
export function TopicsList({userId, setSelectedTopic, topicsData, setTopicsData, refreshData, setRefreshData}: any) {
  const [topicsWithEntries, setTopicsWithEntries] = React.useState([]);
  const [firstLoad, setFirstLoad] = React.useState(true);

  const handleTopicPress = (topic: string) => {
    setSelectedTopic(topic);
  };

  const renderSeparator = () => {
    return <View style={{height: 1, backgroundColor: "gray"}}/>;
  };

  async function getEntriesDayCounts(topicsWithEntries) {
    const dayCounts = {};

    const updateCountsPromises = topicsWithEntries.map(async (topicDoc) => {
      const topic = topicDoc.id;
      const entriesSnapshot = await topicDoc.ref.collection("entries").get();

      const counts = {};

      entriesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const day = data.date;
        if (!counts[day]) {
          counts[day] = 0;
        }

        counts[day] += data.value;
      });

      dayCounts[topic] = counts;
    });

    await Promise.all(updateCountsPromises);
    return dayCounts;
  }



  useEffect(() => {
    if (firstLoad) {
      const topicsCollection = firebase
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("topics");

      const fetchTopics = async () => {
        const snapshot = await topicsCollection.get();
        const topics = snapshot.docs;
        const topicsWithEntriesPromises = [];

        for (const topicDoc of topics) {
          const entriesSnapshot = await topicDoc.ref
              .collection("entries")
              .limit(1)
              .get();
          if (!entriesSnapshot.empty) {
            topicsWithEntriesPromises.push(topicDoc);
          }
        }

        setTopicsWithEntries(topicsWithEntriesPromises);
        setFirstLoad(false); // Set firstLoad to false after fetching topics
      };

      fetchTopics();
    }
  }, [userId, firstLoad]);

// Second effect: Fetch the entries for the topics in topicsWithEntries
  useEffect(() => {
    if (topicsWithEntries.length > 0) {
      const fetchEntriesDayCounts = async () => {
        const dayCounts = await getEntriesDayCounts(topicsWithEntries);
        setTopicsData((prevDayCounts) => ({...prevDayCounts, ...dayCounts}));
      };

      fetchEntriesDayCounts();
    }
  }, [topicsWithEntries]);


  function getSortedUniqueDates() {
    // uniqueDates is the dates for the past 30 days, including today
    const uniqueDates = Array.from({length: 30}, (_, i) =>
        moment()
            .subtract(i, "days")
            .toISOString()
            .split("T")[0]
    );
    return uniqueDates.sort((a, b) => a.localeCompare(b));
  }

  const renderItem = ({item}) => {
    const rowHeight = 20;
    const sortedDates = getSortedUniqueDates();
    const todayDate = moment().toISOString().split("T")[0];
    const maxDataValue = Math.max(
        ...Object.values(topicsData[item])
    );
    const scaleFactor = maxDataValue > 0 ? rowHeight / (maxDataValue * 10) : 1;
    const dateDict = Object.keys(topicsData[item]).reduce((acc, date) => {
          acc[date] = topicsData[item][date];
          return acc;
        }, {}
    );

    return (
        <TouchableOpacity onPress={() => handleTopicPress(item)}>
          <View>
            <View style={rowStyles.row}>
              <Text style={[rowStyles.rowText, {width: 200}]} numberOfLines={1}>{item}</Text>
              <View style={rowStyles.chart}>
                {sortedDates.map((date, index) => (
                    <View
                        key={index}
                        style={[
                          rowStyles.bar,
                          {
                            height: (dateDict[date] ?? 0) * 10 * scaleFactor,
                            left:
                                (moment(date) - moment(todayDate)) / (1000 * 60 * 60 * 24),
                          },
                        ]}
                    />
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
    );
  };


  return (
      <View style={[styles.topicsTableContainer, {borderWidth: 1, borderColor: "black"}]}>
        <FlatList
            data={Object.keys(topicsData)}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            style={styles.flatList}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={renderSeparator}
            ListFooterComponent={() => (<View style={{borderBottomWidth: 1, borderBottomColor: "black"}}/>)}
        />
      </View>
  );
}