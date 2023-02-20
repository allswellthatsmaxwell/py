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
        headerContainer: {
            backgroundColor: '#EECBAD',
            width: '100%',
            height: 200,
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