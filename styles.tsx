import { StyleSheet } from "react-native";

export function getStyles() {
    return StyleSheet.create({
        globalBackground: {
            backgroundColor: "#FAFAFA",
        },
        container: {
            flex: 1,
            alignItems: "center",
        },
        headerContainer: {
            backgroundColor: "#EECBAD",
            width: "100%",
            height: 100,
            borderRadius: 50,
            overflow: "hidden",
            fontWeight: "bold",
            borderWidth: 1,
            borderColor: "#000",
        },
        footer: {
            width: "100%",
            height: 200,
            alignItems: "center",
            overflow: "hidden",
            fontWeight: "bold",
            borderWidth: 0,
            borderColor: "#000",
            top: 0,
            borderBottomWidth: 0,
        },
        centerContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
        },
        loginWrapContainer: {
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
        },
        topicsTableContainer: {
            width: "100%",
            flex: 1,
            justifyContent: "center",
            //   marginTop: 5,
            marginLeft: 0,
            borderLeftWidth: 1,
            borderTopWidth: 1,
        },
        topContainer: {
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 0,
        },
        flatList: {
            maxHeight: "100%",
            width: "100%",
        },
        topLeftCornerContainer: {
            position: "absolute",
            top: 50,
            left: 40,
        },
        topRightCornerFirstPositionContainer: {
            position: "absolute",
            top: 50,
            right: 40,
        },
        topRightCornerSecondPositionContainer: {
            position: "absolute",
            top: 50,
            right: 80,
        },
        centeredView: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        modalView: {
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            alignItems: "center",
            shadowColor: "#000",
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
