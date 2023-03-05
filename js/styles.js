import { StyleSheet } from 'react-native';

export function getStyles() {
    return StyleSheet.create({
        container: {
            flex: 1,
            alignItems: 'center'
        },
        header: {
            backgroundColor: '#f1f8ff'
        },
        headerContainer: {
            backgroundColor: '#EECBAD',
            width: '100%',
            height: 100,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerText: {
            color: 'red',
            fontSize: 20,
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
        topicsTableContainer: {
            width: '100%',
            height: 500,
            alignItems: 'center',
            justifyContent: 'center',
        },
        topContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 0,
        },
        // topContainer: {
        //     position: 'absolute',
        //     top: 0,
        //     right: 0,
        //     alignItems: 'center',
        //     justifyContent: 'center'
        // },
        // bottomContainer: {
        //     position: 'absolute',
        //     bottom: 0,
        //     width: '100%',
        //     alignItems: 'center',
        //     justifyContent: 'center',
        //     backgroundColor: '#eee',
        //     padding: 20,
        // },
        bottomContainer: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: 0,
        },
        // bottomContainer: {
        //     flex: 1,
        //     alignItems: 'center',
        //     position: 'absolute',
        //     bottom: 0,
        // },
        flatList: {
            maxHeight: '100%',
            width: '100%',
        },
        bottomLeftCornerContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%'
        },
        topLeftCornerContainer: {
            position: 'absolute',
            top: 50,
            left: 40
        },
        topRightCornerFirstPositionContainer: {
            position: 'absolute',
            top: 50,
            right: 40
        },
        topRightCornerSecondPositionContainer: {
            position: 'absolute',
            top: 50,
            right: 50
        },
        centeredView: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
        modalView: {
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
    });
}