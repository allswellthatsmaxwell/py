import * as React from 'react';
import { useEffect } from 'react';
import { Table, Row, Rows } from 'react-native-table-component';


export function TopicsList({ userId, selectedTopic, setSelectedTopic }) {
  const [topicsList, setTopicsList] = React.useState([]);


  useEffect(() => {
    const topicsCollection = firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('topics');

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

  const handleTopicPress = (topic) => {
    setSelectedTopic(topic);
  };

  const handleBackPress = () => {
    setSelectedTopic(null);
  };

  // if a topic is selected, show the logs from that topic
  if (selectedTopic) {
    return (
      <View style={styles.topContainer}>
        <Text style={{ fontSize: 20 }}>{selectedTopic}</Text>
        <LogsList userId={userId} topic={selectedTopic} />
        <Button title="Back" onPress={handleBackPress} />
      </View>
    );
  }

  // if no topic is selected, show the list of topics
  return (
    <View>
      <Text>Your logs</Text>
      <FlatList
        data={topicsList}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleTopicPress(item)}>
            <Text>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        style={styles.flatList}
        contentContainerStyle={{ backgroundColor: 'lightgray', padding: 10 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
  
export function LogsList({ userId, topic }) {
  const [logsList, setLogsList] = React.useState([]);

  useEffect(() => {
      const logsCollection = firebase.firestore()
      .collection('users')
      .doc(userId)
      .collection('topics')
      .doc(topic)
      .collection('entries');

      const unsubscribe = logsCollection.onSnapshot((snapshot) => {
      const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("Logs: ", logs);
      setLogsList(logs);
      });

      return () => {
      unsubscribe();
      };
  }, [userId, topic]);


  const tableHead = ['Date', 'Time', 'Value'];
  // formats like "July 6, 11:36 PM"
  const time_format = {hour: '2-digit', minute:'2-digit', hour12: true};
  const day_format = {month: 'short', day: 'numeric'};
  const tableData = logsList.map(
      log => [
      log.timestamp.toDate().toLocaleDateString([], day_format),
      log.timestamp.toDate().toLocaleTimeString([], time_format),
      log.number]);

  return (
      <View style={{ height: 100, width: 300 }}>
      <Table style={{ width: '100%' }} borderStyle={{ borderWidth: 1, borderColor: '#bbb' }}>
          <Row data={tableHead} style={{ backgroundColor: '#f1f8ff'}} textStyle={{ margin: 1 }}/>
          <Rows data={tableData} textStyle={{ margin: 1 }} />
      </Table>
      </View>
  );
}
