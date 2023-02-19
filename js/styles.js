import { StyleSheet } from 'react-native';

export function getStyles() {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        header: {
            backgroundColor: '#f1f8ff'
        },
        headerText: {
            fontSize: 20,
            fontWeight: 'bold',
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: 'lightgray',
            backgroundColor: '#f1f8ff'
        },
        rowText: {
            fontSize: 20,
            color: 'black',
            margin: 1
        },
        centerContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        topContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 30,
        },
        bottomContainer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#eee',
            padding: 20,
        },
        flatList: {
            maxHeight: '50%',
            width: '100%',
        },
        bottomLeftCornerContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%'
        },
    });
}