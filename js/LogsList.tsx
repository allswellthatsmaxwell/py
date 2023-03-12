import {View} from "react-native";
import * as React from "react";
import {useEffect} from "react";
import * as firebase from "firebase";

import {getStyles} from "./styles.js";
import {Row, Rows, Table} from "react-native-table-component";

const styles = getStyles();


// export function EntriesForTopic({selectedTopic}) {
//     return (
//         <View style={styles.topContainer}>
//             <LogsList topic={selectedTopic}/>
//         </View>
//     );
// }

export function LogsList({fbase, selectedTopic, setTopicsOrEntriesChanged}) {
    const [logsList, setLogsList] = React.useState([]);

    const userId = fbase.auth().currentUser.uid;

    useEffect(() => {
        const logsCollection = firebase
            .firestore()
            .collection("users")
            .doc(userId)
            .collection("topics")
            .doc(selectedTopic)
            .collection("entries");

        const unsubscribe = logsCollection.onSnapshot((snapshot) => {
            const logs = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
            console.log("Logs: ", logs);
            setLogsList(logs);
        });

        return () => {
            unsubscribe();
        };
    }, [userId, selectedTopic]);

    setTopicsOrEntriesChanged(false);

    const tableHead = ["Date", "Time", "Value"];
    // formats like "July 6, 11:36 PM"
    const time_format = {hour: "2-digit", minute: "2-digit", hour12: true};
    const day_format = {month: "short", day: "numeric"};
    const tableData = logsList.map((log) => [
        log.timestamp.toDate().toLocaleDateString([], day_format),
        log.timestamp.toDate().toLocaleTimeString([], time_format),
        log.number,
    ]);


    return (
        <View style={{height: 100, width: 300}}>
            <Table
                style={{width: "100%"}}
                borderStyle={{borderWidth: 1, borderColor: "#bbb"}}
            >
                <Row
                    data={tableHead}
                    style={{backgroundColor: "#f1f8ff"}}
                    textStyle={{margin: 1}}
                />
                <Rows data={tableData} textStyle={{margin: 1}}/>
            </Table>
        </View>
    );
}
