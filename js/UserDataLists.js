import * as React from 'react';
import { useEffect } from 'react';
import { Table, Row, Rows } from 'react-native-table-component';
import { Text, View, FlatList, TouchableOpacity} from 'react-native';
import * as firebase from 'firebase';
import { AntDesign } from "@expo/vector-icons";


import { getStyles } from './styles.js';

styles = getStyles();

export function TopicsList({ userId, setSelectedTopic }) {
    const [topicsList, setTopicsList] = React.useState([]);

    const handleTopicPress = (topic) => {
        setSelectedTopic(topic);
    };

    function ListOfTopics() {
        const renderSeparator = () => {
            return (
                <View style={{ height: 1, backgroundColor: 'gray' }} />
            );
        }

        return (
            <View style={styles.centerContainer}>
                <FlatList
                    data={topicsList}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleTopicPress(item)}>
                            <Text style={styles.rowText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    keyExtractor={(item) => item}
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={renderSeparator}
                />
            </View>
        );
    }

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

    return ListOfTopics();
}


export function EntriesForTopic({ userId, selectedTopic, setSelectedTopic }) {

    const handleBackPress = () => {
        setSelectedTopic(null);
    };

    return (
        <View>
            <View style={styles.topContainer}>
                <Text style={{ fontSize: 20 }}>{selectedTopic}</Text>
                <LogsList userId={userId} topic={selectedTopic} />
            </View>
            <View style={styles.topLeftCornerContainer}>
                <TouchableOpacity onPress={handleBackPress}>
                    <AntDesign name="left" size={36} color="blue" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function LogsList({ userId, topic }) {
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
    const time_format = { hour: '2-digit', minute: '2-digit', hour12: true };
    const day_format = { month: 'short', day: 'numeric' };
    const tableData = logsList.map(
        log => [
            log.timestamp.toDate().toLocaleDateString([], day_format),
            log.timestamp.toDate().toLocaleTimeString([], time_format),
            log.number]);

    return (
        <View style={{ height: 100, width: 300 }}>
            <Table style={{ width: '100%' }} borderStyle={{ borderWidth: 1, borderColor: '#bbb' }}>
                <Row data={tableHead} style={{ backgroundColor: '#f1f8ff' }} textStyle={{ margin: 1 }} />
                <Rows data={tableData} textStyle={{ margin: 1 }} />
            </Table>
        </View>
    );
}
